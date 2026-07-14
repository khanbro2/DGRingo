import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Sun, Moon } from "lucide-react";
import { colors as C } from "./theme";

/**
 * App theme (light / dark). The choice persists in localStorage under the SAME
 * key the marketing site uses ("dg-theme"), so a preference set on the website
 * carries into the app and back. Default is LIGHT.
 */
export type Theme = "light" | "dark";
const KEY = "dg-theme";

function initialTheme(): Theme {
  try { const s = localStorage.getItem(KEY); if (s === "dark" || s === "light") return s; } catch { /* ignore */ }
  return "light";
}

const Ctx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
  }, [theme]);
  return <Ctx.Provider value={{ theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);

/** A compact light/dark switch. `variant="icon"` = round icon button (top bars);
 *  `variant="row"` = full-width labelled row (settings lists). */
export function ThemeToggle({ variant = "icon" }: { variant?: "icon" | "row" }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const Icon = dark ? Sun : Moon;

  if (variant === "row") {
    return (
      <button onClick={toggle} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 15px",
        borderRadius: 14, background: C.card, border: `1px solid ${C.lineSoft}`, cursor: "pointer",
        fontFamily: "'Inter',sans-serif",
      }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: C.input, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={C.blue} />
        </span>
        <span style={{ flex: 1, textAlign: "left" }}>
          <span style={{ display: "block", color: C.text, fontSize: 14, fontWeight: 700 }}>Appearance</span>
          <span style={{ display: "block", color: C.muted, fontSize: 12, marginTop: 2 }}>{dark ? "Dark" : "Light"} mode</span>
        </span>
        {/* pill switch */}
        <span style={{ width: 46, height: 26, borderRadius: 999, background: dark ? C.blue : "rgba(120,130,150,0.35)", position: "relative", flexShrink: 0, transition: "background .2s" }}>
          <span style={{ position: "absolute", top: 3, left: dark ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
        </span>
      </button>
    );
  }

  return (
    <button onClick={toggle} title={dark ? "Switch to light mode" : "Switch to dark mode"} aria-label="Toggle theme" style={{
      width: 40, height: 40, borderRadius: 11, background: C.input, border: `1px solid ${C.line}`,
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icon size={17} color={C.muted} />
    </button>
  );
}
