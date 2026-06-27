import { createContext, useContext, useReducer, useCallback, type ReactNode } from "react";

/**
 * Control Hub settings store. In production every save here POSTs to your
 * backend admin API; SECRET values (payment + API keys) are stored server-side
 * encrypted and only the last 4 chars are ever returned to this dashboard.
 */
export interface PaymentProvider {
  id: "stripe" | "paypal" | "bank";
  name: string;
  blurb: string;
  connected: boolean;
  enabled: boolean;
  secretLast4?: string;     // masked tail of the saved secret (never the full key)
  account?: string;         // payout/destination identifier
}
export interface ApiCredential {
  id: string;
  service: string;
  blurb: string;
  status: "set" | "missing";
  last4?: string;
  updated?: string;
}
export interface Webhook { id: string; label: string; url: string; enabled: boolean; secretSet: boolean; }
export interface PlatformKey { id: string; name: string; masked: string; created: string; lastUsed: string; }
export interface GeneralSettings {
  platformName: string; supportEmail: string; currency: string;
  platformFeePct: number; payoutSchedule: string; payoutDestination: string;
}

interface AdminSettings {
  providers: PaymentProvider[];
  credentials: ApiCredential[];
  webhooks: Webhook[];
  platformKeys: PlatformKey[];
  general: GeneralSettings;
}

const last4 = (s: string) => s.replace(/\s/g, "").slice(-4) || "0000";

const initial: AdminSettings = {
  providers: [
    { id: "stripe", name: "Stripe", blurb: "Card payments, subscriptions & payouts", connected: true, enabled: true, secretLast4: "4242", account: "acct_1NxB…  → bank ••6789" },
    { id: "paypal", name: "PayPal", blurb: "PayPal balance & checkout", connected: false, enabled: false },
    { id: "bank", name: "Bank transfer", blurb: "Manual / wire top-ups", connected: false, enabled: false },
  ],
  credentials: [
    { id: "telnyx", service: "Telnyx", blurb: "Numbers, SMS, voice, 10DLC", status: "set", last4: "mock", updated: "Jun 15, 2026" },
    { id: "stripe", service: "Stripe", blurb: "Payments secret key (sk_live_…)", status: "set", last4: "a1b2", updated: "Jun 10, 2026" },
    { id: "paypal", service: "PayPal", blurb: "REST client id & secret", status: "missing" },
    { id: "sendgrid", service: "SendGrid", blurb: "Transactional email", status: "missing" },
  ],
  webhooks: [
    { id: "wh_telnyx", label: "Telnyx — inbound SMS & DLR", url: "/api/telnyx/webhooks/messaging", enabled: true, secretSet: true },
    { id: "wh_stripe", label: "Stripe — payment events", url: "/api/stripe/webhook", enabled: true, secretSet: true },
    { id: "wh_paypal", label: "PayPal — IPN", url: "/api/paypal/ipn", enabled: false, secretSet: false },
  ],
  platformKeys: [
    { id: "pk1", name: "Production API", masked: "pk_live_••••••••3f9a", created: "May 1, 2026", lastUsed: "2m ago" },
    { id: "pk2", name: "Mobile app", masked: "pk_live_••••••••7c21", created: "May 3, 2026", lastUsed: "1h ago" },
  ],
  general: {
    platformName: "DGRINGO", supportEmail: "support@dgringo.app", currency: "USD",
    platformFeePct: 0, payoutSchedule: "Daily", payoutDestination: "Stripe → bank ••6789",
  },
};

type Action =
  | { t: "SAVE_PROVIDER"; id: string; secret: string; account?: string }
  | { t: "TOGGLE_PROVIDER"; id: string }
  | { t: "SAVE_CREDENTIAL"; id: string; key: string }
  | { t: "TOGGLE_WEBHOOK"; id: string }
  | { t: "ADD_WEBHOOK"; label: string; url: string }
  | { t: "CREATE_KEY"; name: string }
  | { t: "REVOKE_KEY"; id: string }
  | { t: "SAVE_GENERAL"; patch: Partial<GeneralSettings> };

function reducer(s: AdminSettings, a: Action): AdminSettings {
  switch (a.t) {
    case "SAVE_PROVIDER":
      return { ...s, providers: s.providers.map((p) => p.id === a.id ? { ...p, connected: true, enabled: true, secretLast4: last4(a.secret), account: a.account ?? p.account } : p) };
    case "TOGGLE_PROVIDER":
      return { ...s, providers: s.providers.map((p) => p.id === a.id ? { ...p, enabled: !p.enabled } : p) };
    case "SAVE_CREDENTIAL":
      return { ...s, credentials: s.credentials.map((c) => c.id === a.id ? { ...c, status: "set", last4: last4(a.key), updated: "just now" } : c) };
    case "TOGGLE_WEBHOOK":
      return { ...s, webhooks: s.webhooks.map((w) => w.id === a.id ? { ...w, enabled: !w.enabled } : w) };
    case "ADD_WEBHOOK":
      return { ...s, webhooks: [...s.webhooks, { id: `wh_${Date.now()}`, label: a.label, url: a.url, enabled: true, secretSet: true }] };
    case "CREATE_KEY":
      return { ...s, platformKeys: [{ id: `pk_${Date.now()}`, name: a.name, masked: `pk_live_••••••••${Math.floor(Math.random() * 9000 + 1000)}`, created: "just now", lastUsed: "never" }, ...s.platformKeys] };
    case "REVOKE_KEY":
      return { ...s, platformKeys: s.platformKeys.filter((k) => k.id !== a.id) };
    case "SAVE_GENERAL":
      return { ...s, general: { ...s.general, ...a.patch } };
    default:
      return s;
  }
}

interface AdminCtx extends AdminSettings {
  saveProvider: (id: string, secret: string, account?: string) => void;
  toggleProvider: (id: string) => void;
  saveCredential: (id: string, key: string) => void;
  toggleWebhook: (id: string) => void;
  addWebhook: (label: string, url: string) => void;
  createKey: (name: string) => void;
  revokeKey: (id: string) => void;
  saveGeneral: (patch: Partial<GeneralSettings>) => void;
}

const Ctx = createContext<AdminCtx | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [s, dispatch] = useReducer(reducer, initial);
  const api: AdminCtx = {
    ...s,
    saveProvider: useCallback((id, secret, account) => dispatch({ t: "SAVE_PROVIDER", id, secret, account }), []),
    toggleProvider: useCallback((id) => dispatch({ t: "TOGGLE_PROVIDER", id }), []),
    saveCredential: useCallback((id, key) => dispatch({ t: "SAVE_CREDENTIAL", id, key }), []),
    toggleWebhook: useCallback((id) => dispatch({ t: "TOGGLE_WEBHOOK", id }), []),
    addWebhook: useCallback((label, url) => dispatch({ t: "ADD_WEBHOOK", label, url }), []),
    createKey: useCallback((name) => dispatch({ t: "CREATE_KEY", name }), []),
    revokeKey: useCallback((id) => dispatch({ t: "REVOKE_KEY", id }), []),
    saveGeneral: useCallback((patch) => dispatch({ t: "SAVE_GENERAL", patch }), []),
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useAdmin(): AdminCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdmin must be used within AdminProvider");
  return c;
}
