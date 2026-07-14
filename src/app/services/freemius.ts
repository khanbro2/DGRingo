/**
 * Freemius (Merchant of Record) checkout — CLIENT.
 *
 * Freemius hosts the payment form; the browser just opens its overlay for the
 * right plan / top-up pack and waits for `purchaseCompleted`. The real work
 * (crediting the wallet / activating the plan) happens SERVER-SIDE via webhook,
 * so the price and ids are never trusted from the browser.
 *
 * All ids come from the SERVER (`GET /api/freemius/config`), so changing them
 * only needs a server .env edit — no frontend rebuild (unlike the old PayPal
 * client-id which was baked into the bundle at build time).
 */
import { API_ORIGIN } from "./origin";

interface CheckoutIds { plan_id: string; pricing_id?: string }
interface FsConfig {
  productId: string;
  publicKey: string;
  checkouts: Record<string, CheckoutIds>;
  /** Optional sandbox token for test-mode checkouts (set server-side). */
  sandbox?: unknown;
}

let configPromise: Promise<FsConfig | null> | null = null;
let cachedReady = false;

/** Fetch the Freemius config once (cached). Returns null if payments are off. */
export function loadFreemiusConfig(): Promise<FsConfig | null> {
  if (configPromise) return configPromise;
  configPromise = fetch(API_ORIGIN + "/api/freemius/config")
    .then((r) => (r.ok ? (r.json() as Promise<FsConfig>) : null))
    .then((c) => { cachedReady = !!(c && c.productId); return c; })
    .catch(() => null);
  return configPromise;
}

/** Synchronous best-effort readiness (true once loadFreemiusConfig has resolved OK). */
export const freemiusReady = () => cachedReady;

/* -------------------------------------------------------- Freemius Checkout JS */
type FsCheckout = { open: (o: Record<string, unknown>) => void; close: () => void };
type FsGlobal = { Checkout: new (o: Record<string, unknown>) => FsCheckout };

let sdkPromise: Promise<FsGlobal> | null = null;
function loadSdk(): Promise<FsGlobal> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  const w = window as unknown as { FS?: FsGlobal };
  if (w.FS?.Checkout) return Promise.resolve(w.FS);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.freemius.com/js/v1/";
    s.onload = () => {
      const fs = (window as unknown as { FS?: FsGlobal }).FS;
      if (fs?.Checkout) resolve(fs); else reject(new Error("Freemius checkout unavailable"));
    };
    s.onerror = () => reject(new Error("Failed to load the payment form"));
    document.head.appendChild(s);
  });
  return sdkPromise;
}

export type CheckoutItem =
  | { kind: "bundle"; tier: string; cycle: "monthly" | "annual" }
  | { kind: "topup"; amount: number };

const keyFor = (i: CheckoutItem) =>
  i.kind === "bundle" ? `bundle:${i.tier}:${i.cycle}` : `topup:${i.amount}`;

export interface CheckoutResult { purchaseId: string }

/**
 * Open the Freemius overlay for a bundle or top-up pack. Resolves when the
 * purchase completes, rejects if the user closes it or on error. The caller
 * should then refresh wallet/subscription from the server — the webhook does
 * the actual fulfilment, this just tells the UI to re-sync.
 */
export async function openCheckout(
  item: CheckoutItem,
  buyer: { email?: string; name?: string } = {},
): Promise<CheckoutResult> {
  const cfg = await loadFreemiusConfig();
  if (!cfg || !cfg.productId) throw new Error("Payments aren't set up yet — try the wallet, or contact support.");
  const ids = cfg.checkouts?.[keyFor(item)];
  if (!ids || !ids.plan_id) throw new Error("This option isn't available for card checkout yet.");

  const FS = await loadSdk();
  return new Promise<CheckoutResult>((resolve, reject) => {
    let purchased = false;
    const handler = new FS.Checkout({
      product_id: cfg.productId,
      public_key: cfg.publicKey,
      ...(cfg.sandbox ? { sandbox: cfg.sandbox } : {}),
    });
    handler.open({
      plan_id: ids.plan_id,
      ...(ids.pricing_id ? { pricing_id: ids.pricing_id } : {}),
      ...(item.kind === "bundle" ? { billing_cycle: item.cycle } : {}),
      licenses: 1,
      ...(buyer.email ? { user_email: buyer.email } : {}),
      ...(buyer.name ? { user_firstname: buyer.name } : {}),
      purchaseCompleted: (data: { purchase?: { id?: string | number }; id?: string | number }) => {
        purchased = true;
        resolve({ purchaseId: String(data?.purchase?.id ?? data?.id ?? "") });
      },
      // `success` fires when the overlay is dismissed after a completed purchase.
      success: () => { /* already resolved by purchaseCompleted */ },
      cancel: () => { if (!purchased) reject(new Error("Checkout closed")); },
    });
  });
}
