import {
  createContext, useContext, useReducer, useCallback, useState, useEffect, useRef, type ReactNode,
} from "react";
import type {
  AppState, User, PhoneNumber, NumberSettings, ActivityItem, CallLog, Preferences, BrandInfo,
  Message, MessageDeliveryStatus, Conversation,
} from "../core/types";
import { initialState } from "./seed";
import { telnyx } from "../services/telnyx";
import { toAppNumber, toAppConversation, toAppCall, availableToApp } from "../services/telnyx/adapt";
import { retailPrice } from "../core/pricing";

/** A purchasable number returned by search (retail-priced). */
export interface AvailableNumber { e164: string; number: string; price: number; sms: boolean; voice: boolean; }

const toE164 = (display: string) => {
  const d = display.replace(/[^\d+]/g, "");
  return d.startsWith("+") ? d : `+${d}`;
};

/**
 * The app's single store. All business logic lives here (auth, messaging,
 * verification, wallet) so screens stay presentational and platform-agnostic.
 * Swapping this for a real backend later means changing only this file.
 */

type Action =
  | { t: "LOGIN"; user: User }
  | { t: "LOGOUT" }
  | { t: "SELECT_NUMBER"; id: string }
  | { t: "APPEND_MESSAGE"; convoId: string; message: Message }
  | { t: "UPDATE_MSG_STATUS"; convoId: string; messageId: string; status: MessageDeliveryStatus; telnyxId?: string }
  | { t: "SET_CONVERSATIONS"; conversations: Conversation[] }
  | { t: "SET_CALLS"; calls: CallLog[] }
  | { t: "MARK_READ"; convoId: string }
  | { t: "ADD_BALANCE"; amount: number }
  | { t: "CHARGE_WALLET"; amount: number; label: string }
  | { t: "BUY_NUMBER"; number: PhoneNumber }
  | { t: "SET_VERIFICATION"; id: string; status: PhoneNumber["verification"] }
  | { t: "UPDATE_SETTINGS"; id: string; patch: Partial<NumberSettings> }
  | { t: "LOG_CALL"; call: CallLog }
  | { t: "SET_NUMBERS"; numbers: PhoneNumber[] }
  | { t: "SET_BALANCE"; balance: number }
  | { t: "SET_BRAND"; brand: BrandInfo | null }
  | { t: "UPDATE_USER"; patch: Partial<User> }
  | { t: "TOGGLE_PREF"; key: keyof Preferences }
  | { t: "BLOCK"; num: string }
  | { t: "UNBLOCK"; num: string }
  | { t: "PUSH_ACTIVITY"; item: ActivityItem }
  | { t: "READ_ALL_ACTIVITY" };

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function reducer(s: AppState, a: Action): AppState {
  switch (a.t) {
    case "LOGIN":
      return { ...s, user: a.user };

    case "LOGOUT":
      return { ...s, user: null };

    case "SELECT_NUMBER":
      return { ...s, activeNumberId: a.id };

    case "APPEND_MESSAGE":
      return {
        ...s,
        conversations: s.conversations.map((c) =>
          c.id === a.convoId
            ? { ...c, preview: a.message.text, time: "now", messages: [...c.messages, a.message] }
            : c,
        ),
      };

    case "UPDATE_MSG_STATUS":
      return {
        ...s,
        conversations: s.conversations.map((c) =>
          c.id === a.convoId
            ? { ...c, messages: c.messages.map((m) => m.id === a.messageId ? { ...m, status: a.status, telnyxId: a.telnyxId ?? m.telnyxId } : m) }
            : c,
        ),
      };

    case "SET_CONVERSATIONS":
      return { ...s, conversations: a.conversations };

    case "SET_CALLS":
      return { ...s, calls: a.calls };

    case "MARK_READ":
      return {
        ...s,
        conversations: s.conversations.map((c) =>
          c.id === a.convoId ? { ...c, unread: 0 } : c,
        ),
      };

    case "ADD_BALANCE":
      return {
        ...s,
        wallet: {
          balance: +(s.wallet.balance + a.amount).toFixed(2),
          txns: [
            { id: `t${Date.now()}`, label: "Wallet top-up", amount: a.amount, time: "now" },
            ...s.wallet.txns,
          ],
        },
      };

    case "CHARGE_WALLET":
      return {
        ...s,
        wallet: {
          balance: +(s.wallet.balance - a.amount).toFixed(2),
          txns: [
            { id: `t${Date.now()}`, label: a.label, amount: -a.amount, time: "now" },
            ...s.wallet.txns,
          ],
        },
      };

    case "BUY_NUMBER":
      return { ...s, numbers: [a.number, ...s.numbers] };

    case "SET_VERIFICATION":
      return {
        ...s,
        numbers: s.numbers.map((n) =>
          n.id === a.id ? { ...n, verification: a.status } : n,
        ),
      };

    case "UPDATE_SETTINGS":
      return {
        ...s,
        numbers: s.numbers.map((n) =>
          n.id === a.id ? { ...n, settings: { ...n.settings, ...a.patch } } : n,
        ),
      };

    case "LOG_CALL":
      return { ...s, calls: [a.call, ...s.calls] };

    case "SET_NUMBERS":
      return { ...s, numbers: a.numbers };

    case "SET_BALANCE":
      return { ...s, wallet: { ...s.wallet, balance: a.balance } };

    case "SET_BRAND":
      return { ...s, brand: a.brand };

    case "UPDATE_USER":
      return { ...s, user: s.user ? { ...s.user, ...a.patch, initial: (a.patch.name ?? s.user.name).charAt(0).toUpperCase() } : s.user };

    case "TOGGLE_PREF":
      return { ...s, preferences: { ...s.preferences, [a.key]: !s.preferences[a.key] } };

    case "BLOCK":
      return s.blocked.includes(a.num) ? s : { ...s, blocked: [a.num, ...s.blocked] };

    case "UNBLOCK":
      return { ...s, blocked: s.blocked.filter((b) => b !== a.num) };

    case "PUSH_ACTIVITY":
      return { ...s, activity: [a.item, ...s.activity] };

    case "READ_ALL_ACTIVITY":
      return { ...s, activity: s.activity.map((x) => ({ ...x, read: true })) };

    default:
      return s;
  }
}

export interface Toast { id: number; message: string; type: "success" | "error"; }

interface Store {
  state: AppState;
  toasts: Toast[];
  showToast: (message: string, type?: "success" | "error") => void;
  // auth
  login: (email: string, name?: string) => void;
  logout: () => void;
  // numbers / inboxes
  selectNumber: (id: string) => void;
  registerNumber: (id: string) => void;   // 10DLC: ensure brand+campaign, assign number
  registerBrand: (displayName?: string) => void;
  updateSettings: (id: string, patch: Partial<NumberSettings>) => void;
  telnyxMode: "mock" | "live";
  // messaging (gated by verification)
  sendMessage: (convoId: string, text: string) => boolean;
  markRead: (convoId: string) => void;
  // calls
  placeCall: (contact: string) => void;
  // profile & preferences
  updateUser: (patch: Partial<User>) => void;
  togglePref: (key: keyof Preferences) => void;
  block: (num: string) => void;
  unblock: (num: string) => void;
  // wallet
  addBalance: (amount: number) => void;
  buyNumber: (n: PhoneNumber) => Promise<boolean>;
  searchNumbers: (countryIso: string, type: "local" | "mobile", areaCode?: string) => Promise<AvailableNumber[]>;
  readAllActivity: () => void;
}

const Ctx = createContext<Store | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const loadedFor = useRef<string | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const pushActivity = useCallback((item: Omit<ActivityItem, "id" | "read">) => {
    dispatch({ t: "PUSH_ACTIVITY", item: { ...item, id: `a${Date.now()}`, read: false } });
  }, []);

  const login: Store["login"] = useCallback((email, name) => {
    const display = name || email.split("@")[0] || "User";
    dispatch({ t: "LOGIN", user: {
      id: `u${Date.now()}`,
      name: display,
      email,
      workspace: `${display}'s Workspace`,
      initial: display.charAt(0).toUpperCase(),
    }});
  }, []);

  const logout = useCallback(() => { loadedFor.current = null; dispatch({ t: "LOGOUT" }); }, []);
  const selectNumber = useCallback((id: string) => dispatch({ t: "SELECT_NUMBER", id }), []);

  // Load workspace data from Telnyx once per login (numbers, balance, brand).
  useEffect(() => {
    const uid = state.user?.id;
    if (!uid || loadedFor.current === uid) return;
    loadedFor.current = uid;
    (async () => {
      // Each call is independent: a failure in one (e.g. no 10DLC brand yet, or
      // an empty CDR feed) must NOT prevent the others (numbers, inbox) loading.
      // NOTE: we do NOT load the Telnyx account balance here — that is the
      // PLATFORM's wholesale balance and belongs only in the Control Hub. The
      // user's wallet (state.wallet.balance) is their own, funded by their top-ups.
      const [numsR, brandR, convosR, cdrsR] = await Promise.allSettled([
        telnyx.listPhoneNumbers(), telnyx.getBrand(),
        telnyx.listConversations(), telnyx.listDetailRecords(),
      ]);

      let appNumbers = state.numbers;
      if (numsR.status === "fulfilled") {
        const nums = numsR.value;
        const prevById = new Map(state.numbers.map((n) => [n.id, n]));
        const merged = nums.map((pn) => toAppNumber(pn, prevById.get(pn.id)));
        const extra = state.numbers.filter((n) => !nums.some((pn) => pn.id === n.id));
        appNumbers = [...merged, ...extra];
        dispatch({ t: "SET_NUMBERS", numbers: appNumbers });
      }
      if (brandR.status === "fulfilled" && brandR.value) dispatch({ t: "SET_BRAND", brand: { id: brandR.value.brandId, displayName: brandR.value.displayName, status: brandR.value.status } });
      if (convosR.status === "fulfilled") dispatch({ t: "SET_CONVERSATIONS", conversations: convosR.value.map(toAppConversation) });
      if (cdrsR.status === "fulfilled") dispatch({ t: "SET_CALLS", calls: cdrsR.value.map((r) => toAppCall(r, appNumbers)) });
    })();
  }, [state.user?.id, state.numbers]);

  const registerBrand: Store["registerBrand"] = useCallback(async (displayName) => {
    try {
      const b = await telnyx.registerBrand(displayName ?? state.user?.workspace ?? "DGRINGO", state.user?.company ?? state.user?.name ?? "DGRINGO");
      dispatch({ t: "SET_BRAND", brand: { id: b.brandId, displayName: b.displayName, status: b.status } });
      pushActivity({ kind: "verification", title: "Brand registered", body: `10DLC brand "${b.displayName}" is ${b.status.toLowerCase()}.`, time: "just now" });
      showToast("Brand registered with Telnyx");
    } catch { showToast("Brand registration failed", "error"); }
  }, [state.user, pushActivity, showToast]);

  // 10DLC: ensure brand + campaign exist, then assign this number to the campaign.
  const registerNumber: Store["registerNumber"] = useCallback(async (id) => {
    const num = state.numbers.find((n) => n.id === id);
    if (!num) return;
    dispatch({ t: "SET_VERIFICATION", id, status: "pending" });
    try {
      let brand = state.brand;
      if (!brand || brand.status !== "VERIFIED") {
        const b = await telnyx.registerBrand(state.user?.workspace ?? "DGRINGO", state.user?.company ?? state.user?.name ?? "DGRINGO");
        brand = { id: b.brandId, displayName: b.displayName, status: b.status };
        dispatch({ t: "SET_BRAND", brand });
      }
      let campaignId = brand.campaignId;
      if (!campaignId) {
        const c = await telnyx.createCampaign(brand.id);
        campaignId = c.campaignId;
        brand = { ...brand, campaignId };
        dispatch({ t: "SET_BRAND", brand });
      }
      await telnyx.assignNumber(toE164(num.number), campaignId);
      dispatch({ t: "SET_VERIFICATION", id, status: "verified" });
      pushActivity({ kind: "verification", title: "Number registered", body: `${num.number} is assigned to your 10DLC campaign and can send SMS.`, time: "just now" });
      showToast("Number registered successfully");
    } catch {
      dispatch({ t: "SET_VERIFICATION", id, status: "unverified" });
      showToast("Registration failed — try again", "error");
    }
  }, [state.numbers, state.brand, state.user, pushActivity, showToast]);

  const updateSettings: Store["updateSettings"] = useCallback((id, patch) => {
    dispatch({ t: "UPDATE_SETTINGS", id, patch });
    // Sync Telnyx-backed voice settings (call recording / forwarding).
    if (patch.autoRecord !== undefined || patch.forwardAll !== undefined) {
      const body: Record<string, unknown> = {};
      if (patch.autoRecord !== undefined) body.call_recording = { inbound_call_recording_enabled: patch.autoRecord };
      if (patch.forwardAll !== undefined) body.call_forwarding = { call_forwarding_enabled: patch.forwardAll };
      telnyx.updateNumberVoice(id, body).catch(() => {});
    }
  }, []);

  const markRead = useCallback((convoId: string) => dispatch({ t: "MARK_READ", convoId }), []);

  const placeCall: Store["placeCall"] = useCallback((contact) => {
    const num = state.numbers.find((n) => n.id === state.activeNumberId) ?? state.numbers[0];
    // Place the call through Telnyx Call Control (fire-and-forget; logged optimistically).
    if (num) telnyx.createCall(toE164(contact), toE164(num.number)).catch(() => {});
    const call: CallLog = {
      id: `k${Date.now()}`, numberId: num?.id ?? "n1", contactFlag: "📞",
      contact, direction: "outgoing", status: "Call ended", duration: "0:00", time: "now",
    };
    dispatch({ t: "LOG_CALL", call });
    pushActivity({ kind: "call", title: "Call placed", body: `Outgoing call to ${contact} via ${num?.settings.label ?? num?.number}.`, time: "just now" });
    showToast(`Calling ${contact}…`);
  }, [state.numbers, state.activeNumberId, pushActivity, showToast]);

  const addBalance: Store["addBalance"] = useCallback((amount) => {
    dispatch({ t: "ADD_BALANCE", amount });
    pushActivity({ kind: "wallet", title: "Top-up successful", body: `$${amount.toFixed(2)} added to your wallet.`, time: "just now" });
    showToast(`$${amount.toFixed(2)} added to wallet`);
  }, [pushActivity, showToast]);

  // Buy a number: requires enough wallet balance, charges the price on success.
  const buyNumber: Store["buyNumber"] = useCallback(async (n) => {
    if (state.wallet.balance < n.price) {
      showToast(`Top up your wallet — $${n.price.toFixed(2)} needed`, "error");
      return false;
    }
    try {
      // Purchase via a Telnyx number order; use the returned Telnyx id.
      const order = await telnyx.createNumberOrder([toE164(n.number)]);
      const tid = order.phone_numbers[0]?.id ?? n.id;
      dispatch({ t: "BUY_NUMBER", number: { ...n, id: tid } });
      dispatch({ t: "CHARGE_WALLET", amount: n.price, label: `Number ${n.number}` });
      pushActivity({ kind: "number", title: "Number purchased", body: `${n.number} ordered from Telnyx for $${n.price.toFixed(2)}/mo. Register it in Trust center to send SMS.`, time: "just now" });
      return true;
    } catch {
      showToast("Number order failed — try again", "error");
      return false;
    }
  }, [state.wallet.balance, pushActivity, showToast]);

  // Search Telnyx for purchasable numbers of a chosen type (local or mobile),
  // priced retail (wholesale + markup). The buy screen lets the user pick the
  // type and explains the difference (local = geographic/cheaper, often voice
  // only outside US/CA; mobile = voice + SMS everywhere, costs a bit more).
  const searchNumbers: Store["searchNumbers"] = useCallback(async (countryIso, type, areaCode) => {
    try {
      const list = await telnyx.searchAvailable({
        country_code: countryIso,
        // area code only applies to geographic (local) numbers
        national_destination_code: type === "local" ? areaCode?.trim() || undefined : undefined,
        features: ["voice"],
        phone_number_type: type,
        limit: 8,
      });
      return list.map((a) => {
        const { number, price, sms, voice } = availableToApp(a);
        return { e164: a.phone_number, number, price: retailPrice(price), sms, voice };
      });
    } catch {
      showToast("Couldn't load numbers — try again", "error");
      return [];
    }
  }, [showToast]);

  const readAllActivity = useCallback(() => dispatch({ t: "READ_ALL_ACTIVITY" }), []);
  const updateUser = useCallback((patch: Partial<User>) => dispatch({ t: "UPDATE_USER", patch }), []);
  const togglePref = useCallback((key: keyof Preferences) => dispatch({ t: "TOGGLE_PREF", key }), []);
  const block = useCallback((num: string) => dispatch({ t: "BLOCK", num }), []);
  const unblock = useCallback((num: string) => dispatch({ t: "UNBLOCK", num }), []);

  // sendMessage is the key gated action: a number must be verified to send.
  const sendMessage: Store["sendMessage"] = useCallback((convoId, text) => {
    const convo = state.conversations.find((c) => c.id === convoId);
    const num = state.numbers.find((n) => n.id === convo?.numberId);
    if (num && num.verification !== "verified") {
      showToast("Register this number in Trust center to send SMS", "error");
      return false;
    }
    // Optimistic append, then reflect Telnyx delivery lifecycle: sending → sent → delivered.
    const msgId = `m${Date.now()}`;
    dispatch({ t: "APPEND_MESSAGE", convoId, message: { id: msgId, text, sent: true, time: now(), status: "sending" } });
    if (num && convo) {
      (async () => {
        try {
          const sent = await telnyx.sendMessage(toE164(num.number), toE164(convo.contact), text);
          dispatch({ t: "UPDATE_MSG_STATUS", convoId, messageId: msgId, status: "sent", telnyxId: sent.id });
          const dlr = await telnyx.getMessageStatus(sent.id);
          dispatch({ t: "UPDATE_MSG_STATUS", convoId, messageId: msgId, status: dlr === "delivered" ? "delivered" : "failed" });
        } catch {
          dispatch({ t: "UPDATE_MSG_STATUS", convoId, messageId: msgId, status: "failed" });
        }
      })();
    }
    return true;
  }, [state.conversations, state.numbers, showToast]);

  return (
    <Ctx.Provider value={{
      state, toasts, showToast,
      login, logout, selectNumber, registerNumber, registerBrand, updateSettings,
      telnyxMode: telnyx.mode,
      sendMessage, markRead, placeCall, addBalance, buyNumber, searchNumbers, readAllActivity,
      updateUser, togglePref, block, unblock,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}

/** Convenience selectors. */
export function useActiveNumber(): PhoneNumber | undefined {
  const { state } = useApp();
  return state.numbers.find((n) => n.id === state.activeNumberId) ?? state.numbers[0];
}
