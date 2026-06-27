/**
 * PayPal client helper. The browser only uses the PUBLIC client id (to render
 * the PayPal button); the secret lives on the backend proxy, which actually
 * creates and captures the order. Flow:
 *   button → createOrder() → backend POST /api/paypal/create-order → orderID
 *   user approves in PayPal → captureOrder() → backend captures → wallet credit
 */
type Env = Record<string, string | undefined>;
const env: Env = (import.meta as unknown as { env: Env }).env ?? {};

export const PAYPAL_CLIENT_ID = env.VITE_PAYPAL_CLIENT_ID ?? "";
const API_BASE = env.VITE_API_BASE?.replace(/\/telnyx$/, "") ?? "/api"; // → "/api"
const PAYPAL_BASE = `${API_BASE}/paypal`;

export const paypalConfigured = () => PAYPAL_CLIENT_ID.length > 0;

let sdkPromise: Promise<unknown> | null = null;

/** Load the PayPal JS SDK once and resolve when window.paypal is ready. */
export function loadPayPalSdk(): Promise<unknown> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  const w = window as unknown as { paypal?: unknown };
  if (w.paypal) return Promise.resolve(w.paypal);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&currency=USD&intent=capture`;
    s.onload = () => resolve((window as unknown as { paypal?: unknown }).paypal);
    s.onerror = () => reject(new Error("Failed to load PayPal SDK"));
    document.head.appendChild(s);
  });
  return sdkPromise;
}

/** Ask the backend to create a PayPal order for `amount` USD. Returns orderID. */
export async function createOrder(amount: number): Promise<string> {
  const r = await fetch(`${PAYPAL_BASE}/create-order`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  const j = await r.json();
  if (!r.ok || !j.id) throw new Error(j.error || "create-order failed");
  return j.id;
}

/** Ask the backend to capture an approved order. Returns the captured amount. */
export async function captureOrder(orderID: string): Promise<number> {
  const r = await fetch(`${PAYPAL_BASE}/capture-order`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderID }),
  });
  const j = await r.json();
  if (!r.ok || !j.ok) throw new Error(j.error || "Payment not completed");
  return Number(j.amount);
}
