import type { Currency } from "./prefs";
import type { Quote } from "./symbols";

/** Only $-denominated commodities/crypto get converted; index points, %, and 원 stay as-is. */
export function displayPrice(quote: Quote, price: number, currency: Currency, usdKrwRate: number | null) {
  if (currency === "KRW" && quote.suffix === "$" && usdKrwRate) {
    return { value: price * usdKrwRate, suffix: "원" };
  }
  return { value: price, suffix: quote.suffix };
}

export function formatNumber(value: number, decimals: number) {
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDelta(change: number, changePercent: number, decimals: number) {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${formatNumber(change, decimals)} (${sign}${changePercent.toFixed(2)}%)`;
}
