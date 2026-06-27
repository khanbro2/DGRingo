/**
 * DGRINGO — Telnyx backend proxy + inbox store (Node 18+, zero dependencies).
 *
 * Two jobs:
 *  1) PROXY  — the app calls /api/telnyx/* on YOUR origin; this server forwards
 *     to https://api.telnyx.com/v2/* and injects `Authorization: Bearer <KEY>`
 *     so the secret API key NEVER reaches the browser.
 *  2) INBOX  — Telnyx has no "list conversations" endpoint. This server receives
 *     inbound SMS via the `message.received` webhook, records outbound sends, and
 *     groups them into threads per (owned number, contact). The app reads them at
 *     GET /api/telnyx/messaging/conversations.
 *
 * Run:
 *   TELNYX_API_KEY=KEY_xxx node server/telnyx-proxy.mjs
 *
 * Endpoints:
 *   ANY  /api/telnyx/*                      → forwarded to api.telnyx.com/v2/*
 *   POST /api/telnyx/messages               → forwarded, then recorded as outbound
 *   GET  /api/telnyx/messaging/conversations→ served from the local inbox store
 *   POST /webhooks/telnyx                    → Telnyx events (message.received, DLRs)
 *
 * NOTE: the inbox store is IN-MEMORY (resets on restart). For production, swap the
 * `threads` Map for a database (Postgres/Redis). The route shapes stay identical.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, normalize, extname } from "node:path";
import { fileURLToPath } from "node:url";

const KEY = process.env.TELNYX_API_KEY;
// Hostinger (and most PaaS) inject the port to listen on via PORT.
const PORT = Number(process.env.PORT ?? process.env.TELNYX_PROXY_PORT ?? 8787);
const TELNYX = "https://api.telnyx.com/v2";
const PREFIX = "/api/telnyx";

// Built front-end (vite build output). In production this one Node server hosts
// the marketing site (/), the app (/app) and the Control Hub (/admin) alongside
// the API, so a single Hostinger deployment serves everything.
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");

// PayPal (server-side secret). PAYPAL_ENV = "live" | "sandbox".
const PP_ID = process.env.PAYPAL_CLIENT_ID;
const PP_SECRET = process.env.PAYPAL_SECRET;
const PP_BASE = process.env.PAYPAL_ENV === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

// The Telnyx key is optional at boot: without it the static site still serves
// (so the marketing pages are live even before Telnyx is configured); the
// /api/telnyx/* routes just answer 503 until the key is set in the host's env.
if (!KEY) {
  console.warn("⚠ TELNYX_API_KEY not set — serving site only; /api/telnyx/* will return 503.");
}

/* ------------------------------------------------------------------ helpers */
const send = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
};

const readBody = async (req) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return chunks.length ? Buffer.concat(chunks).toString() : "";
};

/* ------------------------------------------------------------------- PayPal */
// OAuth2 client-credentials token (server-side; secret never reaches the app).
async function paypalToken() {
  const auth = Buffer.from(`${PP_ID}:${PP_SECRET}`).toString("base64");
  const r = await fetch(`${PP_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!r.ok) throw new Error(`PayPal token ${r.status}`);
  return (await r.json()).access_token;
}

async function paypalCreateOrder(amount) {
  const token = await paypalToken();
  const value = Number(amount).toFixed(2);
  const r = await fetch(`${PP_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ amount: { currency_code: "USD", value }, description: "DGRINGO wallet top-up" }],
    }),
  });
  return { status: r.status, body: await r.json() };
}

async function paypalCaptureOrder(orderId) {
  const token = await paypalToken();
  const r = await fetch(`${PP_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const body = await r.json();
  // Pull the actually-captured amount so the wallet is credited with the real value.
  const cap = body?.purchase_units?.[0]?.payments?.captures?.[0];
  return { status: r.status, completed: body?.status === "COMPLETED", amount: cap?.amount?.value, body };
}

/* ------------------------------------------------------------ static serving */
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
  ".map": "application/json", ".csv": "text/csv", ".txt": "text/plain; charset=utf-8",
};

// Clean URLs → built HTML entries. Root is the marketing site; the app and the
// Control Hub live under /app and /admin.
const PAGE_ROUTES = {
  "/": "site.html",
  "/app": "index.html",
  "/admin": "admin.html",
};

async function tryFile(absPath) {
  try {
    const s = await stat(absPath);
    if (s.isFile()) return absPath;
  } catch { /* not found */ }
  return null;
}

/** Serve the built front-end from /dist. Returns true if it handled the request. */
async function serveStatic(req, res) {
  // strip query/hash, decode, and prevent path traversal
  let pathname = decodeURIComponent((req.url || "/").split("?")[0].split("#")[0]);
  const clean = pathname.replace(/\/+$/, "") || "/";

  let filePath = null;
  if (PAGE_ROUTES[clean]) {
    filePath = join(DIST, PAGE_ROUTES[clean]);
  } else {
    // safe-join inside DIST
    const rel = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
    const candidate = join(DIST, rel);
    if (candidate.startsWith(DIST)) filePath = await tryFile(candidate);
  }

  // SPA / unknown-route fallback → marketing site (its router is hash-based)
  if (!filePath) filePath = join(DIST, "site.html");

  try {
    const data = await readFile(filePath);
    const type = MIME[extname(filePath)] || "application/octet-stream";
    const cacheable = filePath.includes(`${join("dist", "assets")}`) || /\.(png|jpe?g|svg|webp|woff2?|ico)$/.test(filePath);
    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": cacheable ? "public, max-age=31536000, immutable" : "no-cache",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found. Did you run `npm run build`?");
  }
  return true;
}

const digits = (s) => (s ?? "").replace(/\D/g, "");
const shortTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const flagFor = (e164) => {
  const d = digits(e164);
  if (d.startsWith("1")) return "🇺🇸";
  if (d.startsWith("44")) return "🇬🇧";
  if (d.startsWith("92")) return "🇵🇰";
  if (d.startsWith("91")) return "🇮🇳";
  if (d.startsWith("971")) return "🇦🇪";
  if (d.startsWith("61")) return "🇦🇺";
  return "🌐";
};

const telnyxFetch = (path, init = {}) =>
  fetch(TELNYX + path, {
    ...init,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });

/* ------------------------------------------------------ in-memory inbox store */
// key: `${ownedE164}|${contactE164}`  →  thread object
const threads = new Map();
let msgSeq = 0;

const keyOf = (owned, contact) => `${digits(owned)}|${digits(contact)}`;

function recordMessage({ owned, contact, direction, text, status, telnyxId }) {
  if (!owned || !contact) return;
  const k = keyOf(owned, contact);
  let t = threads.get(k);
  if (!t) {
    t = { id: `thr_${digits(owned)}_${digits(contact)}`, owned, contact, contact_flag: flagFor(contact), unread: 0, messages: [] };
    threads.set(k, t);
  }
  t.messages.push({
    id: telnyxId ?? `local_${++msgSeq}`,
    direction,
    text: text ?? "",
    status: status ?? (direction === "inbound" ? "delivered" : "sent"),
    time: shortTime(),
  });
  t.time = shortTime();
  if (direction === "inbound") t.unread += 1;
}

function updateStatus(telnyxId, status) {
  if (!telnyxId) return;
  for (const t of threads.values()) {
    const m = t.messages.find((x) => x.id === telnyxId);
    if (m) { m.status = status; return; }
  }
}

// Resolve owned E.164 → Telnyx phone_number_id (cached 60s), so the app can
// match each thread to the right owned number (Conversation.numberId).
let idMap = new Map();
let idMapAt = 0;
async function ownedNumberId(e164) {
  if (Date.now() - idMapAt > 60_000) {
    try {
      const r = await telnyxFetch("/phone_numbers?page[size]=250");
      const j = await r.json();
      const next = new Map();
      for (const n of j.data ?? []) next.set(digits(n.phone_number), n.id);
      idMap = next; idMapAt = Date.now();
    } catch (e) { console.error("phone_numbers lookup failed:", e.message); }
  }
  return idMap.get(digits(e164)) ?? digits(e164); // fall back to E.164 digits
}

async function conversationsPayload() {
  const out = [];
  for (const t of threads.values()) {
    out.push({
      id: t.id,
      phone_number_id: await ownedNumberId(t.owned),
      contact: t.contact,
      contact_flag: t.contact_flag,
      unread: t.unread,
      time: t.time ?? shortTime(),
      messages: t.messages,
    });
  }
  return { data: out };
}

/* --------------------------------------------------------------- webhook in */
function handleWebhook(payload) {
  const ev = payload?.data ?? payload;
  const type = ev?.event_type ?? ev?.record_type;
  const p = ev?.payload ?? {};
  if (type === "message.received") {
    const contact = p.from?.phone_number;
    const owned = p.to?.[0]?.phone_number;
    recordMessage({ owned, contact, direction: "inbound", text: p.text, telnyxId: p.id });
    console.log(`📥 inbound SMS ${contact} → ${owned}`);
  } else if (type === "message.sent" || type === "message.finalized") {
    const status = p.to?.[0]?.status ?? "sent";
    updateStatus(p.id, status);
  }
}

/* ------------------------------------------------------------------- routing */
createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, "");

  // 1) Telnyx webhooks
  if (req.url?.startsWith("/webhooks/telnyx")) {
    const body = await readBody(req);
    try { handleWebhook(JSON.parse(body || "{}")); } catch (e) { console.error("webhook parse:", e.message); }
    return send(res, 200, { ok: true });
  }

  // 2) PayPal: create + capture orders for wallet top-ups (secret stays here).
  if (req.url?.startsWith("/api/paypal/")) {
    if (!PP_ID || !PP_SECRET) return send(res, 503, { error: "PayPal not configured (set PAYPAL_CLIENT_ID / PAYPAL_SECRET)" });
    const body = await readBody(req);
    const data = body ? JSON.parse(body) : {};
    try {
      if (req.url.startsWith("/api/paypal/create-order") && req.method === "POST") {
        const amount = Number(data.amount);
        if (!(amount > 0)) return send(res, 400, { error: "Invalid amount" });
        const { status, body: order } = await paypalCreateOrder(amount);
        return send(res, status, { id: order.id, status: order.status });
      }
      if (req.url.startsWith("/api/paypal/capture-order") && req.method === "POST") {
        if (!data.orderID) return send(res, 400, { error: "Missing orderID" });
        const { status, completed, amount } = await paypalCaptureOrder(data.orderID);
        return send(res, status, { ok: completed, amount: amount ? Number(amount) : undefined });
      }
      return send(res, 404, { error: "Unknown PayPal route" });
    } catch (e) {
      return send(res, 502, { error: `PayPal error: ${e.message}` });
    }
  }

  // Anything that isn't an API/webhook route → serve the built front-end.
  if (!req.url?.startsWith(PREFIX)) return serveStatic(req, res);

  if (!KEY) return send(res, 503, { errors: [{ detail: "Telephony not configured (set TELNYX_API_KEY)" }] });
  const path = req.url.slice(PREFIX.length); // e.g. "/messages" or "/messaging/conversations"

  // 2) Inbox: serve conversations from the local store
  if (req.method === "GET" && path.startsWith("/messaging/conversations")) {
    return send(res, 200, await conversationsPayload());
  }

  const body = await readBody(req);

  // 3) Everything else → forward to Telnyx with the secret key
  try {
    const r = await telnyxFetch(path, {
      method: req.method,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : body || undefined,
    });
    const text = await r.text();

    // record outbound sends so they appear in the inbox immediately
    if (req.method === "POST" && path.startsWith("/messages") && r.ok) {
      try {
        const j = JSON.parse(text);
        const d = j.data ?? {};
        recordMessage({
          owned: d.from?.phone_number ?? JSON.parse(body || "{}").from,
          contact: d.to?.[0]?.phone_number ?? JSON.parse(body || "{}").to,
          direction: "outbound",
          text: d.text ?? JSON.parse(body || "{}").text,
          status: d.to?.[0]?.status ?? "queued",
          telnyxId: d.id,
        });
      } catch { /* ignore record errors */ }
    }
    send(res, r.status, text || "{}");
  } catch (e) {
    send(res, 502, { errors: [{ detail: `Proxy error: ${e.message}` }] });
  }
}).listen(PORT, () => {
  console.log(`DGRINGO server listening on :${PORT}`);
  console.log(`  site     : http://localhost:${PORT}/         (marketing)`);
  console.log(`  app      : http://localhost:${PORT}/app      (mobile app)`);
  console.log(`  admin    : http://localhost:${PORT}/admin    (Control Hub)`);
  console.log(`  app API  : http://localhost:${PORT}${PREFIX}  → ${TELNYX}`);
  console.log(`  webhooks : http://localhost:${PORT}/webhooks/telnyx`);
});
