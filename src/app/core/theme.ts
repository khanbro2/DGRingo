/**
 * Central design tokens — single source of truth for the whole app.
 *
 * Cross-platform note: this file holds NO web/DOM logic, only plain values.
 * When the app is ported to React Native (or wrapped via Capacitor), this same
 * token object is reused as-is — screens never hardcode a hex value, so theming
 * stays consistent across web, Android and iOS.
 */

export const colors = {
  // surfaces
  shell: "#04060b",
  bg: "#0a0d14",
  card: "#10141f",
  cardAlt: "#0d1120",
  input: "#161d2e",
  line: "rgba(255,255,255,0.06)",
  lineSoft: "rgba(255,255,255,0.04)",

  // brand
  blue: "#4f8ef7",
  purple: "#9b6ff7",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",

  // text
  text: "#eef0f6",
  muted: "#8892aa",
  faint: "#4d5a72",
} as const;

export const gradients = {
  brand: `linear-gradient(135deg,${colors.blue},${colors.purple})`,
  brandRev: `linear-gradient(135deg,${colors.purple},${colors.blue})`,
  green: "linear-gradient(135deg,#16a34a,#15803d)",
  amber: "linear-gradient(135deg,#f59e0b,#d97706)",
} as const;

export const radius = { sm: 11, md: 14, lg: 18, xl: 24, pill: 999 } as const;

export const font = {
  sans: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

/** Phone-frame sizing used by the web preview shell. */
export const frame = { width: 390, height: 844 } as const;

export const theme = { colors, gradients, radius, font, frame };
export type Theme = typeof theme;

// Short alias kept for readability inside screens.
export const C = colors;
