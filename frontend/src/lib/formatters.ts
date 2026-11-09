/**
 * PlateWise AI — Shared Safe Formatters
 *
 * Safe numerical and currency formatters that accept null, undefined, and NaN,
 * returning an em dash ("—") instead of crashing or returning "NaN".
 *
 * ALWAYS explicitly uses the 'en-IN' locale (Indian Numbering System: lakhs/crores)
 * to guarantee identical rendering across Node.js SSR and client DOM (preventing hydration mismatches).
 */

export const EM_DASH = "—";

function parseFiniteNumber(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "string" && val.trim() === "") return null;
  const num = typeof val === "number" ? val : Number(val);
  if (typeof num !== "number" || Number.isNaN(num) || !Number.isFinite(num)) {
    return null;
  }
  return num;
}

/**
 * Formats a value as Indian Rupee (INR), e.g. "₹1,240" or "₹1,240.50".
 * Returns "—" for null, undefined, or NaN values.
 */
export function formatINR(
  val: number | null | undefined | unknown,
  options?: {
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
    spaceAfterSymbol?: boolean;
  }
): string {
  const num = parseFiniteNumber(val);
  if (num === null) return EM_DASH;

  const minDigits = options?.minimumFractionDigits ?? 0;
  const maxDigits = options?.maximumFractionDigits ?? minDigits;

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  }).format(num);

  const prefix = options?.spaceAfterSymbol ? "₹ " : "₹";
  return `${prefix}${formatted}`;
}

/**
 * Formats a number with Indian locale grouping (e.g. 1,00,000 or 1,240).
 * Returns "—" for null, undefined, or NaN values.
 */
export function formatNumber(
  val: number | null | undefined | unknown,
  decimals?: number
): string {
  const num = parseFiniteNumber(val);
  if (num === null) return EM_DASH;

  const digits = decimals ?? 0;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(num);
}

/**
 * Formats a percentage value (e.g. "24.5%" or "8%").
 * Returns "—" for null, undefined, or NaN values.
 */
export function formatPercent(
  val: number | null | undefined | unknown,
  decimals: number = 0
): string {
  const num = parseFiniteNumber(val);
  if (num === null) return EM_DASH;

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);

  return `${formatted}%`;
}

/**
 * Formats a weight in kilograms (e.g. "14.2 kg" or "1,240 kg").
 * Returns "—" for null, undefined, or NaN values.
 */
export function formatKg(
  val: number | null | undefined | unknown,
  decimals: number = 1
): string {
  const num = parseFiniteNumber(val);
  if (num === null) return EM_DASH;

  return `${formatNumber(num, decimals)} kg`;
}
