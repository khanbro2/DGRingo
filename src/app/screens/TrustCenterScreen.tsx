import type { CSSProperties } from "react";
import { ArrowLeft, ShieldCheck, Info } from "lucide-react";
import { C, gradients, font, radius } from "../core/theme";
import { useApp } from "../store/AppStore";

interface Props { onBack: () => void; }

/**
 * Trust center — the verification flow. Carriers require VoIP numbers to be
 * registered before they can send SMS; unregistered numbers are gated from
 * sending (enforced in the store's sendMessage).
 */
export function TrustCenterScreen({ onBack }: Props) {
  const { state, registerNumber, registerBrand, showToast, telnyxMode } = useApp();
  const pending = state.numbers.filter((n) => n.verification !== "verified");
  const verified = state.numbers.filter((n) => n.verification === "verified");
  const brand = state.brand;
  const brandOk = brand?.status === "VERIFIED";

  return (
    <div style={{ background: C.bg, minHeight: "100%", paddingBottom: 28 }}>
      <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={iconBtn}><ArrowLeft size={17} color={C.text} /></button>
        <p style={{ flex: 1, textAlign: "center", color: C.text, fontSize: 15, fontWeight: 800 }}>Trust center</p>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: "8px 20px 0" }}>
        <h1 style={{ color: C.text, fontSize: 22, fontWeight: 800, lineHeight: 1.25 }}>Register your numbers</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
          Carriers require all VoIP numbers to complete 10DLC registration (brand + campaign via Telnyx) before sending text messages to US and Canadian numbers.
        </p>
      </div>

      {/* Step 1 — account 10DLC brand */}
      <div style={{ padding: "18px 20px 0" }}>
        <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Step 1 · 10DLC Brand</p>
        <div style={{ background: C.card, border: `1px solid ${brandOk ? "rgba(34,197,94,0.3)" : C.line}`, borderRadius: radius.lg, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <ShieldCheck size={22} color={brandOk ? C.green : C.amber} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{brand ? brand.displayName : "Brand not registered"}</p>
            <p style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{brand ? `Status: ${brand.status}` : "Register your business brand to start"}</p>
          </div>
          {!brandOk && <button onClick={() => registerBrand()} style={{ padding: "9px 14px", borderRadius: 11, background: gradients.brand, border: "none", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Register brand</button>}
        </div>
      </div>

      <div style={{ padding: "14px 20px 0" }}>
        <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Step 2 · Register numbers</p>
      </div>

      {/* Pending registrations */}
      <div style={{ padding: "0 20px 0" }}>
        {pending.length === 0 ? (
          <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: radius.lg, padding: 18, display: "flex", alignItems: "center", gap: 12 }}>
            <ShieldCheck size={22} color={C.green} />
            <p style={{ color: C.text, fontSize: 13.5, fontWeight: 600 }}>All your numbers are registered 🎉</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pending.map((n) => (
              <div key={n.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: radius.lg, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: C.input, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21 }}>{n.flag}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: C.text, fontSize: 14, fontWeight: 700, fontFamily: font.mono }}>{n.number}</p>
                    <p style={{ color: n.verification === "pending" ? C.amber : C.red, fontSize: 12, marginTop: 2, fontWeight: 600 }}>
                      {n.verification === "pending" ? "Verification pending" : "Local numbers registration"}
                    </p>
                  </div>
                </div>
                <button onClick={() => registerNumber(n.id)} style={{
                  width: "100%", padding: "13px", borderRadius: radius.md, background: gradients.brand,
                  border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: font.sans,
                  marginBottom: 8,
                }}>Register now</button>
                <button onClick={() => showToast("Opening registration guide…")} style={{
                  width: "100%", padding: "12px", borderRadius: radius.md, background: C.input,
                  border: `1px solid ${C.line}`, color: C.text, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: font.sans,
                }}>Learn more</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verified */}
      {verified.length > 0 && (
        <div style={{ padding: "22px 20px 0" }}>
          <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Registered</p>
          <div style={{ background: C.card, borderRadius: radius.lg, border: `1px solid ${C.lineSoft}`, overflow: "hidden" }}>
            {verified.map((n, i) => (
              <div key={n.id} style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: i < verified.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
                <span style={{ fontSize: 20 }}>{n.flag}</span>
                <p style={{ flex: 1, color: C.text, fontSize: 13.5, fontWeight: 600, fontFamily: font.mono }}>{n.number}</p>
                <ShieldCheck size={17} color={C.green} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "20px 20px 0", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Info size={15} color={C.faint} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ color: C.faint, fontSize: 11.5, lineHeight: 1.5 }}>
          Registration is a one-time carrier requirement (10DLC). Until a number is registered, outbound SMS on that number is blocked.
        </p>
      </div>
    </div>
  );
}

const iconBtn: CSSProperties = { width: 36, height: 36, borderRadius: 11, background: C.input, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 };
