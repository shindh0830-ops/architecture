export type Category = "지수" | "환율" | "원자재" | "금리" | "코인";

export interface SymbolConfig {
  symbol: string;
  label: string;
  category: Category;
  decimals: number;
  suffix?: string;
}

export const SYMBOLS: SymbolConfig[] = [
  { symbol: "^KS11", label: "코스피", category: "지수", decimals: 2 },
  { symbol: "^GSPC", label: "S&P 500", category: "지수", decimals: 2 },
  { symbol: "^IXIC", label: "나스닥", category: "지수", decimals: 2 },
  { symbol: "^DJI", label: "다우존스", category: "지수", decimals: 2 },
  { symbol: "^SOX", label: "필라델피아 반도체", category: "지수", decimals: 2 },
  { symbol: "KRW=X", label: "원/달러 환율", category: "환율", decimals: 2, suffix: "원" },
  { symbol: "CL=F", label: "WTI 원유", category: "원자재", decimals: 2, suffix: "$" },
  { symbol: "GC=F", label: "금(Gold)", category: "원자재", decimals: 2, suffix: "$" },
  { symbol: "^TNX", label: "미국채 10년 금리", category: "금리", decimals: 3, suffix: "%" },
  { symbol: "BTC-USD", label: "비트코인", category: "코인", decimals: 0, suffix: "$" },
];

export const DEFAULT_ORDER = SYMBOLS.map((s) => s.symbol);

/** Symbol used as the USD/KRW exchange rate for currency conversion. */
export const USD_KRW_SYMBOL = "KRW=X";

/** Symbols representative of each market's open/closed status badge. */
export const KR_MARKET_SYMBOL = "^KS11";
export const US_MARKET_SYMBOL = "^GSPC";
export const CRYPTO_MARKET_SYMBOL = "BTC-USD";

export type PeriodKey = "day" | "week" | "month" | "ytd";

export const PERIODS: { key: PeriodKey; label: string; sparklineLength: number }[] = [
  { key: "day", label: "일간", sparklineLength: 10 },
  { key: "week", label: "1주", sparklineLength: 20 },
  { key: "month", label: "1개월", sparklineLength: 60 },
  { key: "ytd", label: "연초대비", sparklineLength: 260 },
];

export interface PeriodChange {
  change: number | null;
  changePercent: number | null;
}

export interface Quote {
  symbol: string;
  label: string;
  category: Category;
  decimals: number;
  suffix?: string;
  price: number | null;
  previousClose: number | null;
  periods: Record<PeriodKey, PeriodChange>;
  series: number[];
  marketOpen: boolean;
  error?: string;
}
