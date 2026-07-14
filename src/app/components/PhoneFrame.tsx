import type { ReactNode } from "react";
import { colors as C, frame } from "../core/theme";

/**
 * The phone chrome — rounded device frame + iOS-style status bar. Children fill
 * the screen area below the status bar. Reused for the standalone mobile app and
 * for the "mobile preview" panel inside the desktop dashboard.
 */
export function PhoneFrame({ children, width = frame.width, height = frame.height }: {
  children: ReactNode; width?: number; height?: number;
}) {
  return (
    <div style={{
      width, height, borderRadius: 48, background: C.bg,
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
      {children}
    </div>
  );
}
