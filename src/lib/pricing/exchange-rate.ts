/**
 * EGP→USD pricing helpers. Pure and framework-free.
 *
 * EGP prices are the fixed source of truth (hardcoded in site.ts). The USD
 * figure is derived from the daily cached rate — never computed against a live
 * API call on page load.
 */

/** Free, keyless FX endpoint. Returns { result, rates: { USD, ... } }. */
export const EXCHANGE_RATE_API = "https://open.er-api.com/v6/latest/EGP";

/** USD equivalent of an EGP amount, rounded to the nearest dollar. */
export function usdFromEgp(
  egp: number,
  rate: number | null | undefined,
): number | null {
  if (rate == null || !Number.isFinite(rate) || rate <= 0) return null;
  return Math.round(egp * rate);
}

/** Render an EGP price with its (optional) USD equivalent. */
export function formatEgpWithUsd(
  priceEgp: string,
  egpAmount: number,
  rate: number | null | undefined,
): string {
  const usd = usdFromEgp(egpAmount, rate);
  return usd == null ? priceEgp : `${priceEgp} (≈ $${usd} USD)`;
}
