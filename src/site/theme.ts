import { useEffect, useState } from "react";

/**
 * Marketing-site theme. Dark is the default identity; light is a clean,
 * PayPal-inspired white variant. The choice persists in localStorage and is
 * applied as `data-theme` on <html> (see :root[data-theme="light"] in styles.css).
 * An inline script in site.html sets the attribute pre-paint to avoid a flash.
 */
export type Theme = "dark" | "light";
const KEY = "dg-theme";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* localStorage blocked — fall back to light */
  }
  return "light";
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem(KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return [theme, toggle];
}
