import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { X, ShieldCheck, Building2, Megaphone, FileUp, Check, Loader2 } from "lucide-react";
import { C, gradients, font, radius } from "../core/theme";
import type { BrandRegistration, CampaignRegistration, RegulatoryRequirement } from "../core/types";
import { useApp } from "../store/AppStore";

/* ============================================================================
   Verification forms — the real KYC/registration flows that gate SMS sending.
   - BrandForm:        10DLC business profile (A2P "KYC"; no document upload).
   - CampaignForm:     use case + sample messages + consent (opt-in) flow.
   - RegulatoryDocsForm: document upload for numbers whose country requires it.
   All run inside the app (no Telnyx popup); they submit to Telnyx via the store.
   ========================================================================== */

const ENTITY_TYPES = [
  { v: "PRIVATE_PROFIT", l: "Private company" },
  { v: "PUBLIC_PROFIT", l: "Public company" },
  { v: "NON_PROFIT", l: "Non-profit" },
  { v: "GOVERNMENT", l: "Government" },
  { v: "SOLE_PROPRIETOR", l: "Sole proprietor" },
];
const VERTICALS = ["TECHNOLOGY", "COMMUNICATION", "FINANCIAL", "RETAIL", "HEALTHCARE", "EDUCATION", "REAL_ESTATE", "PROFESSIONAL", "ENERGY", "HOSPITALITY", "TRANSPORTATION", "NGO"];
const COUNTRIES = ["US", "CA", "GB", "AU", "DE", "FR", "PK", "IN", "AE"];
const USECASES = [
  { v: "2FA", l: "2FA / OTP codes" },
  { v: "ACCOUNT_NOTIFICATION", l: "Account notifications" },
  { v: "CUSTOMER_CARE", l: "Customer care" },
  { v: "DELIVERY_NOTIFICATION", l: "Delivery notifications" },
  { v: "MARKETING", l: "Marketing" },
  { v: "MIXED", l: "Mixed (multiple)" },
];

/* ----------------------------------------------------------------- modal shell */
function Sheet({ title, icon, onClose, children }: { title: string; icon: ReactNode; onClose: () => void; children: ReactNode }) {
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "absolute", inset: 0, zIndex: 120, background: "rgba(0,0,0,0.74)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end" }}>
      <div style={{ width: "100%", maxHeight: "92%", background: C.card, borderRadius: "26px 26px 0 0", border: `1px solid ${C.line}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 11, borderBottom: `1px solid ${C.lineSoft}` }}>
          <span style={{ width: 34, height: 34, borderRadius: 11, background: "rgba(79,142,247,0.14)", display: "grid", placeItems: "center", color: C.blue }}>{icon}</span>
          <h2 style={{ flex: 1, color: C.text, fontSize: 17, fontWeight: 800 }}>{title}</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: C.input, border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}><X size={15} color={C.muted} /></button>
        </div>
        <div style={{ padding: "18px 20px 24px", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

const labelStyle: CSSProperties = { display: "block", color: C.muted, fontSize: 12, fontWeight: 600, marginBottom: 6 };
const inputStyle: CSSProperties = { width: "100%", padding: "12px 13px", background: C.input, border: `1px solid ${C.line}`, borderRadius: radius.md, color: C.text, fontSize: 14, outline: "none", fontFamily: font.sans };

function Text({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <label style={labelStyle}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} style={inputStyle} />
    </div>
  );
}
function Area({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <label style={labelStyle}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
    </div>
  );
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
        {options.map((o) => <option key={o.v} value={o.v} style={{ background: C.card, color: C.text }}>{o.l}</option>)}
      </select>
    </div>
  );
}
function SubmitBtn({ busy, label, onClick, disabled }: { busy: boolean; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={busy || disabled} style={{
      width: "100%", marginTop: 6, padding: "14px", borderRadius: radius.md, border: "none",
      background: disabled ? C.input : gradients.brand, color: disabled ? C.muted : "#fff",
      fontSize: 15, fontWeight: 800, cursor: busy ? "wait" : disabled ? "not-allowed" : "pointer",
      fontFamily: font.sans, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: busy ? 0.75 : 1,
    }}>
      {busy ? <><Loader2 size={16} className="dg-spin" /> Submitting…</> : label}
    </button>
  );
}

/* ----------------------------------------------------------------- BRAND form */
export function BrandForm({ onClose }: { onClose: () => void }) {
  const { registerBrand, state, showToast } = useApp();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState<BrandRegistration>({
    entityType: "PRIVATE_PROFIT",
    displayName: state.user?.workspace?.replace(/'s Workspace$/, "") || "",
    companyName: state.user?.company || "",
    ein: "", vertical: "TECHNOLOGY",
    email: state.user?.email || "", phone: "", website: "",
    street: "", city: "", state: "", postalCode: "", country: "US",
  });
  const set = (k: keyof BrandRegistration) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const sole = f.entityType === "SOLE_PROPRIETOR";

  const submit = async () => {
    const need: [string, string][] = [["Business name", f.companyName], ["Display name", f.displayName], ["Contact email", f.email], ["Contact phone", f.phone], ["Street", f.street], ["City", f.city], ["Postal code", f.postalCode]];
    if (!sole) need.push(["EIN / Tax ID", f.ein]);
    const missing = need.find(([, v]) => !v.trim());
    if (missing) { showToast(`${missing[0]} is required`, "error"); return; }
    setBusy(true);
    const res = await registerBrand(f);
    setBusy(false);
    if (res.ok) onClose();
  };

  return (
    <Sheet title="Register your business" icon={<Building2 size={17} />} onClose={onClose}>
      <p style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.55, marginBottom: 16 }}>
        Carriers (10DLC) require your business identity before sending SMS to US/Canada. Telnyx validates your
        registration number automatically — <b style={{ color: C.text }}>no documents to upload</b>.
      </p>
      <Select label="Business type" value={f.entityType} onChange={(v) => set("entityType")(v)} options={ENTITY_TYPES} />
      <Text label="Legal business name" value={f.companyName} onChange={set("companyName")} placeholder="DGRINGO LLC" />
      <Text label="Brand / display name" value={f.displayName} onChange={set("displayName")} placeholder="DGRINGO" />
      {!sole && <Text label="EIN / Tax ID" value={f.ein} onChange={set("ein")} placeholder="12-3456789" />}
      <Select label="Industry" value={f.vertical} onChange={(v) => set("vertical")(v)} options={VERTICALS.map((v) => ({ v, l: v.charAt(0) + v.slice(1).toLowerCase().replace("_", " ") }))} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Text label="Contact email" value={f.email} onChange={set("email")} placeholder="you@business.com" type="email" />
        <Text label="Contact phone" value={f.phone} onChange={set("phone")} placeholder="+1 555 123 4567" />
      </div>
      <Text label="Website (optional)" value={f.website} onChange={set("website")} placeholder="https://…" />
      <Text label="Street address" value={f.street} onChange={set("street")} placeholder="123 Market St" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Text label="City" value={f.city} onChange={set("city")} placeholder="San Francisco" />
        <Text label="State / region" value={f.state} onChange={set("state")} placeholder="CA" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Text label="Postal code" value={f.postalCode} onChange={set("postalCode")} placeholder="94103" />
        <Select label="Country" value={f.country} onChange={(v) => set("country")(v)} options={COUNTRIES.map((v) => ({ v, l: v }))} />
      </div>
      <SubmitBtn busy={busy} label="Submit for verification" onClick={submit} />
    </Sheet>
  );
}

/* -------------------------------------------------------------- CAMPAIGN form */
export function CampaignForm({ numberId, onClose }: { numberId: string; onClose: () => void }) {
  const { registerNumber, showToast } = useApp();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState<CampaignRegistration>({
    usecase: "MIXED",
    description: "Transactional and customer-service messages to people who opted in through our app.",
    sample1: "Your DGRINGO verification code is 123456.",
    sample2: "Hi! Your number is active. Reply STOP to unsubscribe.",
    messageFlow: "Users opt in by creating an account in the DGRINGO app and confirming their number.",
  });
  const set = (k: keyof CampaignRegistration) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.description.trim() || !f.sample1.trim() || !f.messageFlow.trim()) { showToast("Fill the description, a sample message and the opt-in flow", "error"); return; }
    setBusy(true);
    const res = await registerNumber(numberId, f);
    setBusy(false);
    if (res.ok) onClose();
    else if (res.error) showToast(res.error, "error");
  };

  return (
    <Sheet title="Messaging campaign" icon={<Megaphone size={17} />} onClose={onClose}>
      <p style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.55, marginBottom: 16 }}>
        Tell carriers how you'll use SMS. This is created once, then your numbers attach to it.
      </p>
      <Select label="Use case" value={f.usecase} onChange={(v) => set("usecase")(v)} options={USECASES} />
      <Area label="What you'll send" value={f.description} onChange={set("description")} />
      <Text label="Sample message 1" value={f.sample1} onChange={set("sample1")} />
      <Text label="Sample message 2" value={f.sample2} onChange={set("sample2")} />
      <Area label="How people opt in (consent)" value={f.messageFlow} onChange={set("messageFlow")} />
      <SubmitBtn busy={busy} label="Create campaign & register number" onClick={submit} />
    </Sheet>
  );
}

/* --------------------------------------------------------- REGULATORY DOCS form */
export function RegulatoryDocsForm({ numberId, phoneNumber, onClose }: { numberId: string; phoneNumber: string; onClose: () => void }) {
  const { getNumberRequirements, submitNumberDoc, markNumberVerified, showToast } = useApp();
  const [reqs, setReqs] = useState<RegulatoryRequirement[] | null>(null);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [busy, setBusy] = useState(false);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { getNumberRequirements(phoneNumber).then(setReqs).catch(() => setReqs([])); }, [phoneNumber, getNumberRequirements]);

  const docReqs = (reqs ?? []).filter((r) => r.type === "document");
  const allUploaded = docReqs.length > 0 && docReqs.every((r) => files[r.id]);

  const submit = async () => {
    setBusy(true);
    try {
      for (const r of docReqs) await submitNumberDoc(phoneNumber, r.id, files[r.id]);
      markNumberVerified(numberId);
      onClose();
    } catch (e) { showToast(e instanceof Error ? e.message : "Upload failed — try again", "error"); }
    setBusy(false);
  };

  return (
    <Sheet title="Number documents" icon={<FileUp size={17} />} onClose={onClose}>
      <p style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.55, marginBottom: 16 }}>
        This number's country requires proof of identity / address by law. Upload the documents below — they go
        securely to the carrier for review.
      </p>
      {reqs === null ? (
        <p style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 20 }}>Checking requirements…</p>
      ) : docReqs.length === 0 ? (
        <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: radius.md, padding: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <ShieldCheck size={20} color={C.green} />
          <p style={{ color: C.text, fontSize: 13.5, fontWeight: 600 }}>No documents needed for this number 🎉</p>
        </div>
      ) : (
        <>
          {docReqs.map((r) => (
            <div key={r.id} style={{ background: C.card, border: `1px solid ${files[r.id] ? "rgba(34,197,94,0.4)" : C.line}`, borderRadius: radius.md, padding: 14, marginBottom: 12 }}>
              <p style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{r.name}</p>
              <p style={{ color: C.muted, fontSize: 12, marginTop: 3, lineHeight: 1.45 }}>{r.description}</p>
              <input ref={(el) => { inputs.current[r.id] = el; }} type="file" accept="image/*,application/pdf" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setFiles((p) => ({ ...p, [r.id]: f })); }} />
              <button onClick={() => inputs.current[r.id]?.click()} style={{
                marginTop: 11, width: "100%", padding: "11px", borderRadius: radius.md,
                background: files[r.id] ? "rgba(34,197,94,0.12)" : C.input, border: `1px solid ${files[r.id] ? "rgba(34,197,94,0.4)" : C.line}`,
                color: files[r.id] ? C.green : C.text, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font.sans,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                {files[r.id] ? <><Check size={15} /> {files[r.id].name}</> : <><FileUp size={15} /> Upload file</>}
              </button>
            </div>
          ))}
          <SubmitBtn busy={busy} label="Submit documents" onClick={submit} disabled={!allUploaded} />
        </>
      )}
    </Sheet>
  );
}
