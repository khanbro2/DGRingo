import { useState } from "react";
import { Home, Phone, PhoneCall, MessageSquare, Bell, Settings } from "lucide-react";
import { AppProvider, useApp } from "./store/AppStore";
import { colors as C, gradients, frame } from "./core/theme";
import type { PhoneNumber, ISOCountry } from "./core/types";

import { AuthScreen } from "./screens/AuthScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { NumbersScreen } from "./screens/NumbersScreen";
import { InboxScreen } from "./screens/InboxScreen";
import { CallsScreen } from "./screens/CallsScreen";
import { DialerScreen } from "./screens/DialerScreen";
import { ActivityScreen } from "./screens/ActivityScreen";
import { SettingsScreen, type SettingsRoute } from "./screens/SettingsScreen";
import {
  ProfilePage, GeneralPage, PreferencesPage, NotificationsPage,
  ContactsPage, BlocklistPage, SupportPage,
} from "./screens/SettingsPages";
import { WalletScreen } from "./screens/WalletScreen";
import { NumberSettingsScreen } from "./screens/NumberSettingsScreen";
import { TrustCenterScreen } from "./screens/TrustCenterScreen";
import { BuyNumberModal } from "./components/BuyNumberModal";

type Tab = "home" | "numbers" | "calls" | "inbox" | "activity" | "settings";
type Overlay =
  | { name: "numberSettings"; id: string }
  | { name: "trust" }
  | { name: "billing" }
  | { name: "dialer" }
  | { name: "profile" }
  | { name: "general" }
  | { name: "preferences" }
  | { name: "notifications" }
  | { name: "contacts" }
  | { name: "blocklist" }
  | { name: "support" }
  | null;

const FLAGS: Record<string, { flag: string; country: ISOCountry }> = {
  "+1":  { flag: "🇺🇸", country: "United States" },
  "+44": { flag: "🇬🇧", country: "United Kingdom" },
  "+49": { flag: "🇩🇪", country: "Germany" },
  "+33": { flag: "🇫🇷", country: "France" },
  "+81": { flag: "🇯🇵", country: "Japan" },
  "+61": { flag: "🇦🇺", country: "Australia" },
};

function buildNumber(n: { number: string; price: number; sms: boolean; voice: boolean }): PhoneNumber {
  const key = Object.keys(FLAGS).find((k) => n.number.startsWith(k)) ?? "+1";
  const { flag, country } = FLAGS[key];
  return {
    id: `n${Date.now()}`, flag, number: n.number, country,
    sms: n.sms, voice: n.voice, price: n.price, verification: "unverified",
    settings: { label: "New Number", icon: "📱", businessHours: false, autoRecord: false, transcripts: false, forwardAll: false, muted: false, showInRecent: true, ringtone: "Default" },
  };
}

/** Inner shell — has access to the store. */
function Shell() {
  const { state, toasts, buyNumber, searchNumbers, selectNumber, placeCall, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [showBuy, setShowBuy] = useState(false);

  const unreadMsgs = state.conversations.reduce((s, c) => s + c.unread, 0);
  const unreadActivity = state.activity.filter((a) => !a.read).length;
  const missedCalls = state.calls.filter((c) => c.direction === "missed").length;

  const tabs: Array<{ id: Tab; label: string; Icon: typeof Home; badge?: number }> = [
    { id: "home",     label: "Home",     Icon: Home },
    { id: "numbers",  label: "Numbers",  Icon: Phone },
    { id: "calls",    label: "Calls",    Icon: PhoneCall, badge: missedCalls || undefined },
    { id: "inbox",    label: "Inbox",    Icon: MessageSquare, badge: unreadMsgs || undefined },
    { id: "activity", label: "Activity", Icon: Bell, badge: unreadActivity || undefined },
    { id: "settings", label: "Settings", Icon: Settings },
  ];

  const handlePurchase = (n: { e164: string; number: string; price: number; sms: boolean; voice: boolean }) => {
    // Keep the buy sheet open if the wallet can't cover it, so the user can top up.
    if (state.wallet.balance < n.price) {
      showToast(`Insufficient balance — top up $${(n.price - state.wallet.balance).toFixed(2)} more`, "error");
      return;
    }
    setShowBuy(false);
    buyNumber(buildNumber(n)).then((ok) => {
      if (ok) showToast(`Number ${n.number} purchased for $${n.price}/mo`);
    });
  };

  const openInboxFor = (id: string) => { selectNumber(id); setActiveTab("inbox"); };

  const goSettings = (route: SettingsRoute) => {
    if (route === "numbers") { setActiveTab("numbers"); return; }
    setOverlay({ name: route });
  };

  const renderTab = () => {
    switch (activeTab) {
      case "home":     return <HomeScreen onBuyNumber={() => setShowBuy(true)} onOpenInbox={() => setActiveTab("inbox")} onOpenTrust={() => setOverlay({ name: "trust" })} onTopUp={() => setOverlay({ name: "billing" })} />;
      case "numbers":  return <NumbersScreen onBuyNumber={() => setShowBuy(true)} onOpenSettings={(id) => setOverlay({ name: "numberSettings", id })} onOpenInbox={openInboxFor} />;
      case "calls":    return <CallsScreen onOpenDialer={() => setOverlay({ name: "dialer" })} />;
      case "inbox":    return <InboxScreen />;
      case "activity": return <ActivityScreen />;
      case "settings": return <SettingsScreen go={goSettings} />;
    }
  };

  const renderOverlay = () => {
    if (!overlay) return null;
    if (overlay.name === "numberSettings") return <NumberSettingsScreen numberId={overlay.id} onBack={() => setOverlay(null)} onOpenTrust={() => setOverlay({ name: "trust" })} />;
    if (overlay.name === "trust")          return <TrustCenterScreen onBack={() => setOverlay(null)} />;
    if (overlay.name === "billing")        return <WalletScreen onBack={() => setOverlay(null)} onOpenTrust={() => setOverlay({ name: "trust" })} />;
    if (overlay.name === "dialer")         return <DialerScreen onClose={() => setOverlay(null)} onCall={(num) => { placeCall(num); setOverlay(null); setActiveTab("calls"); }} />;
    if (overlay.name === "profile")        return <ProfilePage onBack={() => setOverlay(null)} />;
    if (overlay.name === "general")        return <GeneralPage onBack={() => setOverlay(null)} />;
    if (overlay.name === "preferences")    return <PreferencesPage onBack={() => setOverlay(null)} />;
    if (overlay.name === "notifications")  return <NotificationsPage onBack={() => setOverlay(null)} />;
    if (overlay.name === "contacts")       return <ContactsPage onBack={() => setOverlay(null)} />;
    if (overlay.name === "blocklist")      return <BlocklistPage onBack={() => setOverlay(null)} />;
    if (overlay.name === "support")        return <SupportPage onBack={() => setOverlay(null)} />;
    return null;
  };

  return (
    <>
      {/* Main content */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 0 }}>
        {overlay ? (
          <div key={overlay.name} className="tab-screen" style={{ position: "absolute", inset: 0, overflowY: "auto" }}>
            {renderOverlay()}
          </div>
        ) : (
          <div key={activeTab} className="tab-screen" style={{ position: "absolute", inset: 0, overflowY: "auto" }}>
            {renderTab()}
          </div>
        )}

        {showBuy && <BuyNumberModal onClose={() => setShowBuy(false)} onPurchase={handlePurchase} onSearch={searchNumbers} />}

        {/* Toasts */}
        <div style={{ position: "absolute", top: 14, left: 14, right: 14, zIndex: 300, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
          {toasts.map((t) => (
            <div key={t.id} style={{
              padding: "12px 16px", borderRadius: 14,
              background: t.type === "success" ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#dc2626,#b91c1c)",
              color: "#fff", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              animation: "slideDown 0.28s ease", display: "flex", alignItems: "center", gap: 10, border: "1px solid rgba(255,255,255,0.12)",
            }}>
              <span style={{ fontSize: 15 }}>{t.type === "success" ? "✓" : "✕"}</span>{t.message}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom tab bar — hidden while an overlay (drill-down) is open */}
      {!overlay && (
        <div style={{ height: 82, flexShrink: 0, background: C.cardAlt, borderTop: `1px solid ${C.line}`, display: "flex", alignItems: "stretch", paddingBottom: 10 }}>
          {tabs.map(({ id, label, Icon, badge }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: "none", border: "none", cursor: "pointer", position: "relative", paddingTop: 6 }}>
                {active && <div style={{ position: "absolute", top: 0, width: 28, height: 3, borderRadius: "0 0 4px 4px", background: gradients.brand }} />}
                <div style={{ position: "relative" }}>
                  <Icon size={22} color={active ? C.blue : C.faint} />
                  {badge && !active && (
                    <div style={{ position: "absolute", top: -5, right: -7, minWidth: 17, height: 17, borderRadius: 9, padding: "0 4px", background: C.red, fontSize: 9, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${C.cardAlt}` }}>{badge}</div>
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? C.blue : C.faint, letterSpacing: 0.1 }}>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/** Auth gate — show login until a user exists. */
function Gate() {
  const { state, toasts } = useApp();
  if (state.user) return <Shell />;
  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 0 }}>
      <div className="tab-screen" style={{ position: "absolute", inset: 0, overflowY: "auto" }}>
        <AuthScreen />
      </div>
      <div style={{ position: "absolute", top: 14, left: 14, right: 14, zIndex: 300, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ padding: "12px 16px", borderRadius: 14, background: t.type === "success" ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", animation: "slideDown 0.28s ease", display: "flex", alignItems: "center", gap: 10, border: "1px solid rgba(255,255,255,0.12)" }}>
            <span style={{ fontSize: 15 }}>{t.type === "success" ? "✓" : "✕"}</span>{t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.shell}; font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; -ms-overflow-style: none; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-16px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes glowPulse { 0%,100% { box-shadow: 0 0 6px 2px rgba(34,197,94,0.7); } 50% { box-shadow: 0 0 12px 4px rgba(34,197,94,0.3); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .tab-screen { animation: fadeIn 0.22s ease; }
        .glow-dot { animation: glowPulse 2s ease-in-out infinite; }
        .spin { animation: spin 0.7s linear infinite; }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.shell, padding: "20px 0", fontFamily: "'Inter', sans-serif" }}>
        <div style={{
          width: frame.width, height: frame.height, borderRadius: 48, background: C.bg,
          border: "8px solid #181f30",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 48px 120px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04)",
          display: "flex", flexDirection: "column", position: "relative", overflow: "hidden",
        }}>
          {/* Status bar */}
          <div style={{ height: 50, paddingInline: 26, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bg }}>
            <span style={{ color: C.text, fontSize: 13, fontWeight: 700, letterSpacing: 0.2 }}>9:41</span>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
                {[6, 9, 12, 15].map((h, i) => <div key={i} style={{ width: 3, height: h, borderRadius: 1.5, background: i < 3 ? C.text : "rgba(238,240,246,0.3)" }} />)}
              </div>
              <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
                <circle cx="7.5" cy="10" r="1.3" fill={C.text} />
                <path d="M4 6.5a5 5 0 0 1 7 0" stroke={C.text} strokeWidth="1.4" strokeLinecap="round" />
                <path d="M1.5 4A8.5 8.5 0 0 1 13.5 4" stroke="rgba(238,240,246,0.4)" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
                <div style={{ width: 22, height: 11, borderRadius: 3, border: "1.5px solid rgba(238,240,246,0.5)", padding: "1.5px", display: "flex" }}>
                  <div style={{ width: "76%", background: C.green, borderRadius: 1.5 }} />
                </div>
                <div style={{ width: 2, height: 5, background: "rgba(238,240,246,0.4)", borderRadius: "0 1px 1px 0" }} />
              </div>
            </div>
          </div>

          <AppProvider>
            <Gate />
          </AppProvider>
        </div>
      </div>
    </>
  );
}
