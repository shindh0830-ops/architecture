import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type Category = "지수" | "환율" | "원자재" | "금리" | "코인";

interface SymbolConfig {
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

export interface Quote {
  symbol: string;
  label: string;
  category: Category;
  decimals: number;
  suffix?: string;
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  series: number[];
  error?: string;
}

async function fetchOne(cfg: SymbolConfig): Promise<Quote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    cfg.symbol
  )}?interval=15m&range=1d`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PersonalDashboard/1.0)" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error("no result");

    const meta = result.meta;
    const price: number | null = meta?.regularMarketPrice ?? null;
    const previousClose: number | null =
      meta?.chartPreviousClose ?? meta?.previousClose ?? null;

    const closes: (number | null)[] =
      result.indicators?.quote?.[0]?.close ?? [];
    const series = closes.filter((v): v is number => typeof v === "number");

    const change = price !== null && previousClose !== null ? price - previousClose : null;
    const changePercent =
      change !== null && previousClose ? (change / previousClose) * 100 : null;

    return {
      symbol: cfg.symbol,
      label: cfg.label,
      category: cfg.category,
      decimals: cfg.decimals,
      suffix: cfg.suffix,
      price,
      previousClose,
      change,
      changePercent,
      series,
    };
  } catch (err) {
    return {
      symbol: cfg.symbol,
      label: cfg.label,
      category: cfg.category,
      decimals: cfg.decimals,
      suffix: cfg.suffix,
      price: null,
      previousClose: null,
      change: null,
      changePercent: null,
      series: [],
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

export async function GET() {
  const quotes = await Promise.all(SYMBOLS.map(fetchOne));
  return NextResponse.json({ quotes, updatedAt: new Date().toISOString() });
}
