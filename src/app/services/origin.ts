/**
 * Absolute origin for every backend call.
 *
 * - WEB build: empty string → same-origin ("/api/…"), exactly as before.
 * - NATIVE build (Capacitor): set `VITE_API_ORIGIN=https://digiringo.com` at
 *   build time. The packaged app's own origin is `https://localhost`, so relative
 *   "/api/…" URLs would hit the device, not the server — this prefix fixes that.
 *
 * The server already sends `Access-Control-Allow-Origin: *`, so cross-origin
 * calls from the native shell work.
 */
type Env = Record<string, string | undefined>;
const env: Env = (import.meta as unknown as { env: Env }).env ?? {};

export const API_ORIGIN: string = (env.VITE_API_ORIGIN ?? "").replace(/\/$/, "");
