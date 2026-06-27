import { PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, Grid3x3, Phone } from "lucide-react";
import { C, gradients, font, radius } from "../core/theme";
import { useApp } from "../store/AppStore";
import type { CallDirection } from "../core/types";

interface Props { onOpenDialer: () => void; }

const DIR: Record<CallDirection, { Icon: typeof PhoneCall; color: string }> = {
  incoming: { Icon: PhoneIncoming, color: C.blue },
  outgoing: { Icon: PhoneOutgoing, color: C.green },
  missed:   { Icon: PhoneMissed,   color: C.red },
};

/** Calls — call history log, with a keypad FAB to open the dialer. */
export function CallsScreen({ onOpenDialer }: Props) {
  const { state, placeCall } = useApp();
  const missed = state.calls.filter((c) => c.direction === "missed").length;

  return (
    <div style={{ background: C.bg, minHeight: "100%", paddingBottom: 100, position: "relative" }}>
      <div style={{ padding: "16px 20px 14px" }}>
        <h1 style={{ color: C.text, fontSize: 23, fontWeight: 800 }}>Calls</h1>
        <p style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>
          {missed > 0 ? <><span style={{ color: C.red, fontWeight: 600 }}>{missed}</span> missed</> : `${state.calls.length} recent calls`}
        </p>
      </div>

      <div style={{ padding: "0 20px" }}>
        {state.calls.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 70 }}>
            <div style={{ fontSize: 46, marginBottom: 12 }}>📞</div>
            <p style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>No calls yet</p>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Tap the keypad to make a call</p>
          </div>
        ) : (
          <div style={{ background: C.card, borderRadius: radius.lg, border: `1px solid ${C.lineSoft}`, overflow: "hidden" }}>
            {state.calls.map((call, i) => {
              const { Icon, color } = DIR[call.direction];
              const num = state.numbers.find((n) => n.id === call.numberId);
              const isMissed = call.direction === "missed";
              return (
                <div key={call.id} style={{ padding: "13px 16px", borderBottom: i < state.calls.length - 1 ? `1px solid ${C.lineSoft}` : "none", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: C.input, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{call.contactFlag}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: isMissed ? C.red : C.text, fontSize: 13, fontWeight: 700, fontFamily: font.mono }}>{call.contact}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <Icon size={13} color={color} />
                      <span style={{ color: C.muted, fontSize: 12 }}>{call.status}{call.duration ? ` · ${call.duration}` : ""}</span>
                    </div>
                    <p style={{ color: C.faint, fontSize: 10.5, marginTop: 2 }}>via {num?.settings.label ?? num?.number}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7, flexShrink: 0 }}>
                    <span style={{ color: C.muted, fontSize: 11 }}>{call.time}</span>
                    <button onClick={() => placeCall(call.contact)} title="Call back" style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(34,197,94,0.14)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <Phone size={15} color={C.green} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Keypad / dialer FAB */}
      <button onClick={onOpenDialer} title="Open dialer" style={{
        position: "fixed", bottom: 98, right: "calc(50% - 195px + 16px)", width: 58, height: 58, borderRadius: "50%",
        background: gradients.green, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 6px 24px rgba(34,197,94,0.45)", zIndex: 20,
      }}>
        <Grid3x3 size={24} color="#fff" />
      </button>
    </div>
  );
}
