import { API_BASE } from "./config";

/**
 * Thin HTTP client used in "live" mode. It calls YOUR backend proxy
 * (API_BASE), NOT api.telnyx.com directly — the proxy holds the secret key.
 *
 * Query params are serialised with Telnyx's bracket/deepObject convention
 * (e.g. filter[country_code]=US, filter[features][]=sms).
 */
export class TelnyxError extends Error {
  constructor(public status: number, message: string, public detail?: unknown) {
    super(message);
    this.name = "TelnyxError";
  }
}

type Query = Record<string, string | number | boolean | string[] | undefined>;

/** The signed-in user's token — the proxy requires it so only authenticated
 *  users can use the platform's telephony (prevents anonymous abuse). */
const authHeader = (): Record<string, string> => {
  try {
    const t = localStorage.getItem("dg-token") || localStorage.getItem("dg-admin-token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch {
    return {};
  }
};

function toSearch(query?: Query): string {
  if (!query) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((item) => p.append(`${k}[]`, String(item)));
    else p.append(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function http<T>(
  path: string,
  opts: { method?: string; query?: Query; body?: unknown } = {},
): Promise<T> {
  const { method = "GET", query, body } = opts;
  const res = await fetch(`${API_BASE}${path}${toSearch(query)}`, {
    method,
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as { errors?: Array<{ detail?: string }> })?.errors?.[0]?.detail ?? res.statusText;
    throw new TelnyxError(res.status, msg, json);
  }
  return json as T;
}
