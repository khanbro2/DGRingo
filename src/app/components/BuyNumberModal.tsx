import { useState, useEffect, useCallback } from "react";
import { X, ChevronDown, Check, Search, Loader2 } from "lucide-react";

const C = {
  bg: "#0a0d14", card: "#10141f", input: "#161d2e",
  blue: "#4f8ef7", purple: "#9b6ff7", green: "#22c55e",
  text: "#eef0f6", muted: "#8892aa",
};

// iso = Telnyx filter[country_code]; code = dial code shown to the user.
const COUNTRIES = [
  { iso:"US", flag:"🇺🇸", name:"United States", code:"+1"  },
  { iso:"GB", flag:"🇬🇧", name:"United Kingdom",code:"+44" },
  { iso:"DE", flag:"🇩🇪", name:"Germany",       code:"+49" },
  { iso:"FR", flag:"🇫🇷", name:"France",        code:"+33" },
  { iso:"CA", flag:"🇨🇦", name:"Canada",        code:"+1"  },
  { iso:"JP", flag:"🇯🇵", name:"Japan",         code:"+81" },
  { iso:"AU", flag:"🇦🇺", name:"Australia",     code:"+61" },
  { iso:"BR", flag:"🇧🇷", name:"Brazil",        code:"+55" },
];

export interface AvailableNumber { e164: string; number: string; price: number; sms: boolean; voice: boolean; }

type NumType = "local" | "mobile";

interface Props {
  onClose: () => void;
  onPurchase: (n: AvailableNumber) => void;
  onSearch: (countryIso: string, type: NumType, areaCode?: string) => Promise<AvailableNumber[]>;
}

function Tag({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 0.4, padding: "2px 7px", borderRadius: 6,
      background: "rgba(79,142,247,0.14)", color: C.blue, textTransform: "uppercase",
    }}>{label}</span>
  );
}

function TypeBtn({ active, onClick, title, sub }: { active: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "11px 12px", borderRadius: 14, cursor: "pointer", textAlign: "left",
      background: active ? "rgba(79,142,247,0.12)" : C.input,
      border: `1.5px solid ${active ? C.blue : "rgba(255,255,255,0.07)"}`,
      fontFamily: "'Inter',sans-serif",
    }}>
      <p style={{ color: active ? C.text : C.muted, fontSize: 14, fontWeight: 700 }}>{title}</p>
      <p style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{sub}</p>
    </button>
  );
}

export function BuyNumberModal({ onClose, onPurchase, onSearch }: Props) {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [cDrop, setCDrop] = useState(false);
  const [numType, setNumType] = useState<NumType>("local");
  const [areaCode, setAreaCode] = useState("");
  const [results, setResults] = useState<AvailableNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep] = useState<"pick" | "confirm">("pick");

  const load = useCallback(async (iso: string, type: NumType, ac: string) => {
    setLoading(true); setSelected(null);
    const r = await onSearch(iso, type, ac);
    setResults(r); setLoading(false); setSearched(true);
  }, [onSearch]);

  // Load numbers when the modal opens and whenever the country or type changes.
  useEffect(() => { load(country.iso, numType, areaCode); /* eslint-disable-next-line */ }, [country.iso, numType]);

  const chosenNumber = results.find((n) => n.number === selected);

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "absolute", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end",
      }}
    >
      <div style={{
        width: "100%", background: "#111829",
        borderRadius: "26px 26px 0 0",
        border: "1px solid rgba(255,255,255,0.07)",
        maxHeight: "88%", overflowY: "auto",
        boxShadow: "0 -12px 60px rgba(0,0,0,0.6)",
      }}>
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 2px" }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.18)" }} />
        </div>

        {/* Header */}
        <div style={{
          padding: "14px 20px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div>
            <h2 style={{ color: C.text, fontSize: 19, fontWeight: 800 }}>
              {step === "pick" ? "Buy a Number" : "Confirm Purchase"}
            </h2>
            {step === "pick" && <p style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>Choose a country and select a number</p>}
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 11,
            background: C.input, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={16} color={C.muted} />
          </button>
        </div>

        {step === "pick" ? (
          <div style={{ padding: "20px 20px 28px" }}>
            {/* Country picker */}
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: 0.8, textTransform: "uppercase" }}>Country</p>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <button onClick={() => setCDrop((v) => !v)} style={{
                width: "100%", padding: "13px 16px",
                background: C.input, border: `1.5px solid ${cDrop ? C.blue : "rgba(255,255,255,0.07)"}`,
                borderRadius: 14, color: C.text, fontSize: 14,
                display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                fontFamily: "'Inter',sans-serif",
              }}>
                <span style={{ fontSize: 22 }}>{country.flag}</span>
                <span style={{ flex: 1, textAlign: "left", fontWeight: 500 }}>{country.name}</span>
                <span style={{ color: C.muted, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>{country.code}</span>
                <ChevronDown size={15} color={C.muted} style={{ transform: cDrop ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              {cDrop && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20,
                  background: "#151c2c", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14, overflow: "hidden",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.65)",
                }}>
                  {COUNTRIES.map((c, i) => (
                    <button key={c.iso} onClick={() => { setCountry(c); setCDrop(false); }} style={{
                      width: "100%", padding: "12px 16px",
                      background: country.iso === c.iso ? "rgba(79,142,247,0.12)" : "transparent",
                      border: "none", cursor: "pointer",
                      borderBottom: i < COUNTRIES.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      display: "flex", alignItems: "center", gap: 10,
                      fontFamily: "'Inter',sans-serif",
                    }}>
                      <span style={{ fontSize: 20 }}>{c.flag}</span>
                      <span style={{ flex: 1, color: C.text, fontSize: 13, textAlign: "left", fontWeight: country.iso === c.iso ? 600 : 400 }}>{c.name}</span>
                      <span style={{ color: C.muted, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>{c.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Number type: local vs mobile (difference explained) */}
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: 0.8, textTransform: "uppercase" }}>Number Type</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <TypeBtn active={numType === "local"} onClick={() => setNumType("local")} title="Local" sub="Calls · cheaper" />
              <TypeBtn active={numType === "mobile"} onClick={() => setNumType("mobile")} title="Mobile" sub="Calls + SMS" />
            </div>
            <p style={{ color: C.muted, fontSize: 11.5, lineHeight: 1.5, marginBottom: 18 }}>
              {numType === "local"
                ? "Geographic number for calls. On local numbers SMS works only in the US & Canada — elsewhere choose Mobile to send texts."
                : "Mobile number that supports both calls and SMS in every country. Costs a little more than a local number."}
            </p>

            {/* Area code (local numbers only) + search */}
            {numType === "local" && (<>
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: 0.8, textTransform: "uppercase" }}>Area Code <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></p>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <input
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") load(country.iso, numType, areaCode); }}
                placeholder="e.g. 628, 212, 310…"
                style={{
                  flex: 1, padding: "13px 16px",
                  background: C.input, border: "1.5px solid rgba(255,255,255,0.07)",
                  borderRadius: 14, color: C.text, fontSize: 14,
                  outline: "none", fontFamily: "'Inter',sans-serif",
                }}
              />
              <button onClick={() => load(country.iso, numType, areaCode)} disabled={loading} style={{
                padding: "0 16px", background: C.input, border: "1.5px solid rgba(255,255,255,0.07)",
                borderRadius: 14, color: C.text, cursor: loading ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700, fontSize: 13,
              }}>
                <Search size={15} color={C.muted} /> Search
              </button>
            </div>
            </>)}

            {/* Available numbers */}
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, marginBottom: 10, letterSpacing: 0.8, textTransform: "uppercase" }}>Available Numbers</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22, minHeight: 80 }}>
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "26px 0", color: C.muted, fontSize: 13 }}>
                  <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} /> Searching Telnyx for numbers…
                </div>
              ) : results.length > 0 ? (
                results.map((n) => (
                  <button key={n.e164} onClick={() => setSelected(n.number)} style={{
                    padding: "14px 16px",
                    background: selected === n.number ? "rgba(79,142,247,0.1)" : C.input,
                    border: `1.5px solid ${selected === n.number ? C.blue : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 14, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                    fontFamily: "'Inter',sans-serif",
                    transition: "border-color 0.15s, background 0.15s",
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      border: selected === n.number ? "none" : "2px solid rgba(255,255,255,0.2)",
                      background: selected === n.number ? C.blue : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {selected === n.number && <Check size={12} color="#fff" strokeWidth={3} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        color: C.text, fontSize: 14, fontWeight: 600,
                        fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.3,
                      }}>{n.number}</span>
                      <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                        {n.voice && <Tag label="Voice" />}
                        {n.sms && <Tag label="SMS" />}
                      </div>
                    </div>
                    <span style={{ color: C.green, fontSize: 13, fontWeight: 800 }}>${n.price}/mo</span>
                  </button>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "26px 12px", color: C.muted, fontSize: 13 }}>
                  {searched
                    ? `No ${numType} numbers available for ${country.name}. Try ${numType === "local" ? "Mobile" : "Local"}, or a different country.`
                    : "Searching…"}
                </div>
              )}
            </div>

            <button
              onClick={() => selected && setStep("confirm")}
              disabled={!selected}
              style={{
                width: "100%", padding: "15px",
                background: selected ? `linear-gradient(135deg,${C.blue},${C.purple})` : "rgba(255,255,255,0.06)",
                border: "none", borderRadius: 16,
                color: selected ? "#fff" : C.muted,
                fontSize: 15, fontWeight: 800,
                cursor: selected ? "pointer" : "not-allowed",
                fontFamily: "'Inter',sans-serif",
                transition: "background 0.2s",
              }}
            >
              Continue →
            </button>
          </div>
        ) : (
          <div style={{ padding: "20px 20px 32px" }}>
            {/* Summary card */}
            <div style={{
              background: C.input, borderRadius: 18, padding: "20px",
              border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                <span style={{ fontSize: 38 }}>{country.flag}</span>
                <div>
                  <p style={{
                    color: C.text, fontSize: 16, fontWeight: 800,
                    fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.4,
                  }}>{selected}</p>
                  <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>{country.name}</p>
                </div>
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 9 }}>
                {[
                  { k: "Monthly price",   v: `$${chosenNumber?.price}/mo` },
                  { k: "First charge",    v: `$${chosenNumber?.price}`    },
                  { k: "Features",        v: [chosenNumber?.voice && "Voice", chosenNumber?.sms && "SMS"].filter(Boolean).join(" + ") || "—" },
                  { k: "Activation fee",  v: "Free"                       },
                ].map(({ k, v }) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: C.muted, fontSize: 13 }}>{k}</span>
                    <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep("pick")} style={{
                flex: 1, padding: "14px",
                background: C.input, border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14, color: C.text, fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "'Inter',sans-serif",
              }}>Back</button>
              <button
                onClick={() => chosenNumber && onPurchase(chosenNumber)}
                style={{
                  flex: 2, padding: "14px",
                  background: `linear-gradient(135deg,${C.blue},${C.purple})`,
                  border: "none", borderRadius: 14, color: "#fff",
                  fontSize: 14, fontWeight: 800, cursor: "pointer",
                  fontFamily: "'Inter',sans-serif",
                  boxShadow: "0 6px 20px rgba(79,142,247,0.4)",
                }}
              >
                Confirm — ${chosenNumber?.price}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
