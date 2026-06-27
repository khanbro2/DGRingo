import { useState, type ReactNode, type CSSProperties } from "react";
import {
  ArrowLeft, ChevronRight, Search, Phone, MessageSquare, Plus, X,
  Mail, MessageCircle, HelpCircle,
} from "lucide-react";
import { C, gradients, font, radius } from "../core/theme";
import { useApp } from "../store/AppStore";
import type { Preferences } from "../core/types";

/* ------------------------------------------------------------------ */
/* Shared settings UI                                                  */
/* ------------------------------------------------------------------ */

export function SettingsShell({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <div style={{ background: C.bg, minHeight: "100%", paddingBottom: 28 }}>
      <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={iconBtn}><ArrowLeft size={17} color={C.text} /></button>
        <p style={{ flex: 1, textAlign: "center", color: C.text, fontSize: 15, fontWeight: 800 }}>{title}</p>
        <div style={{ width: 36 }} />
      </div>
      {children}
    </div>
  );
}

function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div style={{ padding: "0 20px 16px" }}>
      {title && <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>{title}</p>}
      <div style={{ background: C.card, borderRadius: radius.lg, border: `1px solid ${C.lineSoft}`, overflow: "hidden" }}>{children}</div>
    </div>
  );
}

function Row({ label, sub, children, onClick, last }: { label: string; sub?: string; children?: ReactNode; onClick?: () => void; last?: boolean }) {
  return (
    <div onClick={onClick} style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, borderBottom: last ? "none" : `1px solid ${C.lineSoft}`, cursor: onClick ? "pointer" : "default" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>{label}</p>
        {sub && <p style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{sub}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{children}</div>
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer", position: "relative", background: on ? gradients.brand : "rgba(255,255,255,0.12)", transition: "background 0.2s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </button>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 7 }}>{label}</p>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type}
        style={{ width: "100%", padding: "13px 14px", background: C.input, border: `1px solid ${C.line}`, borderRadius: radius.md, color: C.text, fontSize: 14, outline: "none", fontFamily: font.sans }} />
    </div>
  );
}

const PrefRow = ({ pkey, label, sub, last }: { pkey: keyof Preferences; label: string; sub?: string; last?: boolean }) => {
  const { state, togglePref } = useApp();
  return <Row label={label} sub={sub} last={last}><Toggle on={state.preferences[pkey]} onClick={() => togglePref(pkey)} /></Row>;
};

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export function ProfilePage({ onBack }: { onBack: () => void }) {
  const { state, updateUser, showToast } = useApp();
  const u = state.user!;
  const [name, setName] = useState(u.name);
  const [email, setEmail] = useState(u.email);
  const [phone, setPhone] = useState(u.phone ?? "");
  const [company, setCompany] = useState(u.company ?? "");

  const save = () => {
    if (!name.trim() || !email.trim()) { showToast("Name and email are required", "error"); return; }
    updateUser({ name: name.trim(), email: email.trim(), phone: phone.trim(), company: company.trim() });
    showToast("Profile saved");
    onBack();
  };

  return (
    <SettingsShell title="Profile" onBack={onBack}>
      <div style={{ display: "flex", justifyContent: "center", padding: "4px 0 20px" }}>
        <div style={{ width: 84, height: 84, borderRadius: "50%", background: gradients.brand, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 32, fontWeight: 800, boxShadow: "0 8px 28px rgba(79,142,247,0.4)" }}>{u.initial}</div>
      </div>
      <div style={{ padding: "0 20px" }}>
        <Field label="Full name" value={name} onChange={setName} placeholder="Your name" />
        <Field label="Email" value={email} onChange={setEmail} placeholder="you@email.com" type="email" />
        <Field label="Phone" value={phone} onChange={setPhone} placeholder="+1 (555) 000-0000" />
        <Field label="Company" value={company} onChange={setCompany} placeholder="Company name" />
        <button onClick={save} style={primaryBtn}>Save changes</button>
      </div>
    </SettingsShell>
  );
}

/* ------------------------------------------------------------------ */
/* General                                                             */
/* ------------------------------------------------------------------ */

export function GeneralPage({ onBack }: { onBack: () => void }) {
  const { state, updateUser, selectNumber, showToast } = useApp();
  const [workspace, setWorkspace] = useState(state.user?.workspace ?? "");
  const active = state.numbers.find((n) => n.id === state.activeNumberId) ?? state.numbers[0];
  const [pickNum, setPickNum] = useState(false);

  return (
    <SettingsShell title="General" onBack={onBack}>
      <div style={{ padding: "0 20px 16px" }}>
        <Field label="Workspace name" value={workspace} onChange={setWorkspace} />
        <button onClick={() => { updateUser({ workspace: workspace.trim() || state.user!.workspace }); showToast("Workspace updated"); }} style={primaryBtn}>Save</button>
      </div>

      <Group title="Defaults">
        <Row label="Default sending number" sub={`${active?.flag} ${active?.number}`} onClick={() => setPickNum((v) => !v)}>
          <ChevronRight size={16} color={C.faint} />
        </Row>
        {pickNum && state.numbers.map((n, i) => (
          <Row key={n.id} label={`${n.flag} ${n.settings.label}`} sub={n.number} last={i === state.numbers.length - 1}
            onClick={() => { selectNumber(n.id); setPickNum(false); showToast("Default number updated"); }}>
            {n.id === active?.id && <span style={{ color: C.blue, fontSize: 12, fontWeight: 700 }}>Active</span>}
          </Row>
        ))}
      </Group>

      <Group title="Region">
        <Row label="Language" onClick={() => showToast("English (US)")}><span style={muted}>English (US)</span><ChevronRight size={16} color={C.faint} /></Row>
        <Row label="Time zone" onClick={() => showToast("Auto-detected from device")}><span style={muted}>Auto</span><ChevronRight size={16} color={C.faint} /></Row>
        <Row label="Appearance" last><span style={muted}>Dark</span></Row>
      </Group>
    </SettingsShell>
  );
}

/* ------------------------------------------------------------------ */
/* Preferences                                                         */
/* ------------------------------------------------------------------ */

export function PreferencesPage({ onBack }: { onBack: () => void }) {
  return (
    <SettingsShell title="Preferences" onBack={onBack}>
      <Group title="Messaging">
        <PrefRow pkey="sounds" label="Message sounds" sub="Play a sound on new messages" />
        <PrefRow pkey="readReceipts" label="Read receipts" sub="Let others know you've read" />
        <PrefRow pkey="enterToSend" label="Enter to send" sub="Press Enter to send a message" last />
      </Group>
      <Group title="Display">
        <PrefRow pkey="compact" label="Compact layout" sub="Tighter spacing in lists" last />
      </Group>
    </SettingsShell>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export function NotificationsPage({ onBack }: { onBack: () => void }) {
  return (
    <SettingsShell title="Notifications" onBack={onBack}>
      <Group title="Alerts">
        <PrefRow pkey="smsAlerts" label="SMS alerts" sub="Notify on new messages" />
        <PrefRow pkey="callAlerts" label="Call alerts" sub="Notify on incoming calls" />
        <PrefRow pkey="lowBalance" label="Low balance" sub="Alert when below $5.00" last />
      </Group>
      <Group title="Other">
        <PrefRow pkey="push" label="Push notifications" sub="Allow system push" />
        <PrefRow pkey="marketing" label="Product updates" sub="News and offers" last />
      </Group>
    </SettingsShell>
  );
}

/* ------------------------------------------------------------------ */
/* Contacts                                                            */
/* ------------------------------------------------------------------ */

export function ContactsPage({ onBack }: { onBack: () => void }) {
  const { state, placeCall, showToast } = useApp();
  const [q, setQ] = useState("");

  // Derive a unique contact list from conversations + call history.
  const map = new Map<string, { contact: string; flag: string }>();
  state.conversations.forEach((c) => map.set(c.contact, { contact: c.contact, flag: c.contactFlag }));
  state.calls.forEach((c) => { if (!map.has(c.contact)) map.set(c.contact, { contact: c.contact, flag: c.contactFlag }); });
  const contacts = [...map.values()].filter((c) => c.contact.toLowerCase().includes(q.toLowerCase()));

  return (
    <SettingsShell title="Contacts" onBack={onBack}>
      <div style={{ padding: "0 20px 14px", position: "relative" }}>
        <Search size={14} color={C.muted} style={{ position: "absolute", left: 33, top: 13, pointerEvents: "none" }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contacts…"
          style={{ width: "100%", padding: "11px 14px 11px 36px", background: C.input, border: `1px solid ${C.line}`, borderRadius: 13, color: C.text, fontSize: 13, outline: "none", fontFamily: font.sans }} />
      </div>
      <div style={{ padding: "0 20px" }}>
        {contacts.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 50 }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>👤</div>
            <p style={{ color: C.text, fontWeight: 700 }}>No contacts found</p>
          </div>
        ) : (
          <div style={{ background: C.card, borderRadius: radius.lg, border: `1px solid ${C.lineSoft}`, overflow: "hidden" }}>
            {contacts.map((c, i) => (
              <div key={c.contact} style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: i < contacts.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: C.input, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{c.flag}</div>
                <p style={{ flex: 1, color: C.text, fontSize: 13.5, fontWeight: 600, fontFamily: font.mono }}>{c.contact}</p>
                <button onClick={() => showToast("Opening conversation…")} style={smallBtn("rgba(79,142,247,0.14)")}><MessageSquare size={15} color={C.blue} /></button>
                <button onClick={() => placeCall(c.contact)} style={smallBtn("rgba(34,197,94,0.14)")}><Phone size={15} color={C.green} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </SettingsShell>
  );
}

/* ------------------------------------------------------------------ */
/* Blocklist                                                           */
/* ------------------------------------------------------------------ */

export function BlocklistPage({ onBack }: { onBack: () => void }) {
  const { state, block, unblock, showToast } = useApp();
  const [val, setVal] = useState("");

  const add = () => {
    const n = val.trim();
    if (!n) return;
    if (state.blocked.includes(n)) { showToast("Already blocked", "error"); return; }
    block(n); setVal(""); showToast("Number blocked");
  };

  return (
    <SettingsShell title="Blocklist" onBack={onBack}>
      <div style={{ padding: "0 20px 16px", display: "flex", gap: 10 }}>
        <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Add number to block…"
          style={{ flex: 1, padding: "12px 14px", background: C.input, border: `1px solid ${C.line}`, borderRadius: radius.md, color: C.text, fontSize: 13, outline: "none", fontFamily: font.mono }} />
        <button onClick={add} style={{ padding: "0 16px", borderRadius: radius.md, background: gradients.brand, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700 }}><Plus size={15} /> Block</button>
      </div>
      <div style={{ padding: "0 20px" }}>
        {state.blocked.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 50 }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>🚫</div>
            <p style={{ color: C.text, fontWeight: 700 }}>No blocked numbers</p>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Blocked numbers can't call or message you</p>
          </div>
        ) : (
          <div style={{ background: C.card, borderRadius: radius.lg, border: `1px solid ${C.lineSoft}`, overflow: "hidden" }}>
            {state.blocked.map((b, i) => (
              <div key={b} style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: i < state.blocked.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><X size={16} color={C.red} /></div>
                <p style={{ flex: 1, color: C.text, fontSize: 13.5, fontWeight: 600, fontFamily: font.mono }}>{b}</p>
                <button onClick={() => { unblock(b); showToast("Number unblocked"); }} style={{ padding: "7px 12px", borderRadius: 10, background: C.input, border: `1px solid ${C.line}`, color: C.text, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Unblock</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </SettingsShell>
  );
}

/* ------------------------------------------------------------------ */
/* Support / Chat with us                                              */
/* ------------------------------------------------------------------ */

const FAQ = [
  { q: "How do I register a number?", a: "Open Settings → Trust center and tap Register now on the number you want to verify." },
  { q: "Why can't I send SMS?", a: "The number must be registered (verified) first. Unverified numbers are blocked from sending." },
  { q: "How do I top up my wallet?", a: "Go to Home → Top Up, or Settings → Plan & billing, and choose an amount." },
];

export function SupportPage({ onBack }: { onBack: () => void }) {
  const { showToast } = useApp();
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const send = () => {
    if (!msg.trim()) { showToast("Type a message first", "error"); return; }
    setMsg(""); showToast("Message sent — we'll reply by email");
  };

  return (
    <SettingsShell title="Chat with us" onBack={onBack}>
      <div style={{ padding: "0 20px 16px", display: "flex", gap: 10 }}>
        <button onClick={() => showToast("Opening live chat…")} style={supportCard}><MessageCircle size={20} color={C.blue} /><span style={supportLabel}>Live chat</span></button>
        <button onClick={() => showToast("support@dgringo.app")} style={supportCard}><Mail size={20} color={C.purple} /><span style={supportLabel}>Email us</span></button>
      </div>

      <Group title="FAQ">
        {FAQ.map((f, i) => (
          <div key={i} style={{ borderBottom: i < FAQ.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
            <div onClick={() => setOpen(open === i ? null : i)} style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <HelpCircle size={16} color={C.muted} />
              <p style={{ flex: 1, color: C.text, fontSize: 13.5, fontWeight: 600 }}>{f.q}</p>
              <ChevronRight size={15} color={C.faint} style={{ transform: open === i ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
            </div>
            {open === i && <p style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.5, padding: "0 16px 14px 42px" }}>{f.a}</p>}
          </div>
        ))}
      </Group>

      <div style={{ padding: "0 20px" }}>
        <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>Send a message</p>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Describe your issue…" rows={4}
          style={{ width: "100%", padding: "13px 14px", background: C.input, border: `1px solid ${C.line}`, borderRadius: radius.md, color: C.text, fontSize: 14, outline: "none", fontFamily: font.sans, resize: "none" }} />
        <button onClick={send} style={primaryBtn}>Send message</button>
      </div>
    </SettingsShell>
  );
}

/* ------------------------------------------------------------------ */
/* styles                                                              */
/* ------------------------------------------------------------------ */

const iconBtn: CSSProperties = { width: 36, height: 36, borderRadius: 11, background: C.input, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 };
const primaryBtn: CSSProperties = { width: "100%", marginTop: 6, padding: "14px", borderRadius: radius.md, background: gradients.brand, border: "none", color: "#fff", fontSize: 14.5, fontWeight: 800, cursor: "pointer", fontFamily: font.sans };
const muted: CSSProperties = { color: C.muted, fontSize: 13 };
const smallBtn = (bg: string): CSSProperties => ({ width: 34, height: 34, borderRadius: 10, background: bg, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 });
const supportCard: CSSProperties = { flex: 1, padding: "16px 0", borderRadius: radius.lg, background: C.card, border: `1px solid ${C.lineSoft}`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, fontFamily: font.sans };
const supportLabel: CSSProperties = { color: C.text, fontSize: 13, fontWeight: 700 };
