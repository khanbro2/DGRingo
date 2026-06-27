/**
 * Retail pricing for purchasable numbers.
 *
 * Telnyx returns a WHOLESALE monthly cost per number. We show the user a RETAIL
 * price = wholesale + your markup (your margin). The markup percent is the same
 * idea as the Control Hub's "platform fee".
 *
 * In production this should be fed by your backend / Control Hub settings. For
 * now it reads VITE_NUMBER_MARKUP_PCT (default 35%) so it's tunable per-env.
 */
type Env = Record<string, string | undefined>;
const env: Env = (import.meta as unknown as { env: Env }).env ?? {};

export const NUMBER_MARKUP_PCT = Number(env.VITE_NUMBER_MARKUP_PCT ?? 35);

/** wholesale monthly cost → retail price shown to the user (2 decimals). */
export function retailPrice(wholesale: number): number {
  const marked = wholesale * (1 + NUMBER_MARKUP_PCT / 100);
  return Math.round(marked * 100) / 100;
}
