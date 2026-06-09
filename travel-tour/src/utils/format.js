const CURRENCY_SYMBOL = "\u20B9";

export function formatPrice(value, { withSymbol = true, decimals = 0 } = {}) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return withSymbol ? `${CURRENCY_SYMBOL}0` : "0";
  const text = decimals > 0
    ? n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return withSymbol ? `${CURRENCY_SYMBOL}${text}` : text;
}

export function formatPriceCompact(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return `${CURRENCY_SYMBOL}0`;
  if (n >= 1e7) return `${CURRENCY_SYMBOL}${(n / 1e7).toFixed(1).replace(/\.0$/, "")} Cr`;
  if (n >= 1e5) return `${CURRENCY_SYMBOL}${(n / 1e5).toFixed(1).replace(/\.0$/, "")} L`;
  if (n >= 1e3) return `${CURRENCY_SYMBOL}${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return `${CURRENCY_SYMBOL}${n.toLocaleString()}`;
}

export { CURRENCY_SYMBOL };
export default formatPrice;
