import { NextResponse } from "next/server";
import { SYMBOLS, type Quote, type PeriodKey, type PeriodChange } from "../../lib/symbols";
import { isMarketOpen } from "../../lib/marketStatus";
import type { SymbolConfig } from "../../lib/symbols";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

function pctChange(current: number | null, base: number | null): PeriodChange {
  if (current === null || base === null || base === 0) {
    return { change: null, changePercent: null };
  }
  const change = current - base;
  return { change, changePercent: (change / base) * 100 };
}

/** Index of the latest timestamp at or before targetMs, falling back to the earliest point. */
function findCloseBefore(timestampsMs: number[], targetMs: number): number {
  let idx = 0;
  for (let i = 0; i < timestampsMs.length; i++) {
    if (timestampsMs[i] <= targetMs) idx = i;
    else break;
  }
  return idx;
}

async function fetchOne(cfg: SymbolConfig): Promise<Quote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    cfg.symbol
  )}?interval=1d&range=1y`;

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

    const timestamps: number[] = result.timestamp ?? [];
    const closesRaw: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

    const points: { t: number; c: number }[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const c = closesRaw[i];
      if (typeof c === "number") points.push({ t: timestamps[i] * 1000, c });
    }

    const closes = points.map((p) => p.c);
    const times = points.map((p) => p.t);
    const now = Date.now();

    // meta.chartPreviousClose is the close right before the *requested range* started
    // (a year ago, at range=1y) — not "yesterday". Only meta.previousClose or the
    // second-to-last daily bar are safe stand-ins for the prior day's close.
    const previousClose: number | null =
      meta?.previousClose ?? closes[closes.length - 2] ?? null;

    const weekIdx = findCloseBefore(times, now - 7 * DAY_MS);
    const monthIdx = findCloseBefore(times, now - 30 * DAY_MS);
    const jan1 = new Date(new Date(now).getFullYear(), 0, 1).getTime();
    const ytdIdx = findCloseBefore(times, jan1);

    const periods: Record<PeriodKey, PeriodChange> = {
      day: pctChange(price, previousClose),
      week: pctChange(price, closes[weekIdx] ?? null),
      month: pctChange(price, closes[monthIdx] ?? null),
      ytd: pctChange(price, closes[ytdIdx] ?? null),
    };

    return {
      symbol: cfg.symbol,
      label: cfg.label,
      category: cfg.category,
      decimals: cfg.decimals,
      suffix: cfg.suffix,
      price,
      previousClose,
      periods,
      series: closes,
      marketOpen: isMarketOpen(cfg.symbol),
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
      periods: {
        day: { change: null, changePercent: null },
        week: { change: null, changePercent: null },
        month: { change: null, changePercent: null },
        ytd: { change: null, changePercent: null },
      },
      series: [],
      marketOpen: isMarketOpen(cfg.symbol),
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

export async function GET() {
  const quotes = await Promise.all(SYMBOLS.map(fetchOne));
  return NextResponse.json({ quotes, updatedAt: new Date().toISOString() });
}
