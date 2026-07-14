/**
 * DGRINGO — Freemius (Merchant of Record) integration, SERVER SIDE.
 *
 * Freemius hosts the checkout and collects the payment (card / PayPal on THEIR
 * side, so PK cards work and recurring is handled by them). We never see card
 * details or capture orders — instead Freemius calls our WEBHOOK and we fulfil:
 *   • a top-up pack  → credit the user's wallet
 *   • a plan payment → activate / renew the bundle
 *   • cancel / renewal-failure → mark the subscription past-due
 *
 * All secrets stay here. The browser only ever gets the PUBLIC product id + key.
 *
 * Config (env — same code across sandbox & live):
 *   FREEMIUS_PRODUCT_ID   Freemius product (a.k.a. plugin) id
 *   FREEMIUS_PUBLIC_KEY   pk_… (public; also exposed to the browser)
 *   FREEMIUS_SECRET_KEY   sk_… (SECRET — webhook signature + API auth)
 *   FREEMIUS_CHECKOUTS    JSON — the SINGLE source of truth mapping each DGRINGO
 *                         product to its Freemius plan/pricing ids:
 *     {
 *       "bundle:starter:monthly": { "plan_id":"111", "pricing_id":"222" },
 *       "bundle:starter:annual":  { "plan_id":"111", "pricing_id":"223" },
 *       "topup:10":               { "plan_id":"333", "pricing_id":"444" }
 *     }
 *   Key format: `bundle:<tier>:<cycle>` or `topup:<amount>`. pricing_id optional
 *   (checkout can pick by plan_id + billing_cycle).
 *
 * NOTE: env is read LAZILY (inside the exported functions), NOT at module-eval
 * time — telnyx-proxy.mjs imports this module BEFORE it calls loadEnvFile(), so
 * anything captured up-front would be empty.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const getProductId = () => process.env.FREEMIUS_PRODUCT_ID || "";
export const getPublicKey = () => process.env.FREEMIUS_PUBLIC_KEY || "";
const getSecret = () => process.env.FREEMIUS_SECRET_KEY || "";

/** True once the product id + secret are set — until then the routes 503. */
export const freemiusConfigured = () => !!(getProductId() && getSecret());

/** Parse a checkout key ("bundle:starter:monthly" | "topup:10") into a grant. */
function grantFromKey(key) {
  const p = String(key).split(":");
  if (p[0] === "bundle" && p[1] && p[2]) return { kind: "bundle", tier: p[1], cycle: p[2] === "annual" ? "annual" : "monthly" };
  if (p[0] === "topup" && p[1]) return { kind: "topup", amount: Number(p[1]) || 0 };
  return null;
}

// Parse + reverse-index the checkout map lazily, memoized on the raw env string
// (rebuilds only if FREEMIUS_CHECKOUTS ever changes at runtime).
let _raw = null, _checkouts = {}, _byPricing = {}, _byPlanCycle = {}, _byPlan = {};
function ensureMaps() {
  const raw = process.env.FREEMIUS_CHECKOUTS || "{}";
  if (raw === _raw) return;
  _raw = raw;
  try { _checkouts = JSON.parse(raw); }
  catch (e) { console.error("[freemius] invalid FREEMIUS_CHECKOUTS JSON:", e.message); _checkouts = {}; }
  _byPricing = {}; _byPlanCycle = {}; _byPlan = {};
  for (const [key, ids] of Object.entries(_checkouts)) {
    const grant = grantFromKey(key);
    if (!grant || !ids) continue;
    if (ids.pricing_id != null) _byPricing[String(ids.pricing_id)] = grant;
    if (ids.plan_id != null && grant.cycle) _byPlanCycle[`${ids.plan_id}:${grant.cycle}`] = grant;
    if (ids.plan_id != null) _byPlan[String(ids.plan_id)] = grant; // ambiguous fallback
  }
}

/** The DGRINGO-product → Freemius-ids map, served to the browser verbatim. */
export const getCheckouts = () => { ensureMaps(); return _checkouts; };

/**
 * Verify a Freemius webhook. Freemius signs the RAW request body with
 * HMAC-SHA256 using the product secret key and sends the hex digest in the
 * `x-signature` header. Constant-time compare; false on any mismatch.
 */
export function verifyWebhook(rawBody, signature) {
  const secret = getSecret();
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody || "", "utf8").digest("hex");
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(String(signature).trim(), "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch { return false; }
}

/**
 * Resolve what a payment grants. Tries the most specific key first so a single
 * Freemius plan with monthly+annual pricing still maps to the right cycle.
 * Returns { kind:"bundle", tier, cycle } | { kind:"topup", amount } | null.
 */
export function grantFor({ pricingId, planId, billingCycle } = {}) {
  ensureMaps();
  if (pricingId != null && _byPricing[String(pricingId)]) return _byPricing[String(pricingId)];
  if (planId != null && billingCycle && _byPlanCycle[`${planId}:${billingCycle}`]) return _byPlanCycle[`${planId}:${billingCycle}`];
  if (planId != null && _byPlan[String(planId)]) return _byPlan[String(planId)];
  return null;
}

/**
 * Pull the fields we need out of a Freemius event, tolerating the two shapes
 * Freemius uses (top-level fields vs. nested under `objects`). We log the raw
 * event on first use so the exact paths can be confirmed against a real
 * sandbox delivery, but these defensive lookups cover the documented shape.
 */
export function parseEvent(evt) {
  const o = evt?.objects || {};
  const payment = o.payment || evt?.payment || null;
  const subscription = o.subscription || evt?.subscription || null;
  const user = o.user || evt?.user || null;

  const email =
    user?.email || payment?.user_email || evt?.user_email || evt?.email || null;

  const pricingId =
    payment?.pricing_id ?? subscription?.pricing_id ?? evt?.pricing_id ?? null;
  const planId =
    payment?.plan_id ?? subscription?.plan_id ?? evt?.plan_id ?? null;
  const billingCycle =
    payment?.billing_cycle ?? subscription?.billing_cycle ?? evt?.billing_cycle ?? null;

  const amount = Number(payment?.gross ?? payment?.amount ?? evt?.gross ?? 0) || 0;

  return {
    id: String(evt?.id ?? payment?.id ?? ""),
    type: String(evt?.type || ""),
    email,
    pricingId, planId,
    billingCycle: billingCycle ? String(billingCycle) : null,
    amount,
  };
}
