"use client";

import Sparkline from "./Sparkline";
import type { Quote, PeriodKey } from "./lib/symbols";
import { PERIODS } from "./lib/symbols";
import type { Threshold } from "./lib/prefs";

function formatNumber(value: number, decimals: number) {
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

interface StatTileProps {
  quote: Quote;
  period: PeriodKey;
  isFavorite: boolean;
  onToggleFavorite: (symbol: string) => void;
  threshold?: Threshold;
}

export default function StatTile({ quote, period, isFavorite, onToggleFavorite, threshold }: StatTileProps) {
  const { label, price, series } = quote;
  const { change, changePercent } = quote.periods[period];
  const hasData = price !== null && change !== null && changePercent !== null;
  const positive = (change ?? 0) >= 0;

  const periodMeta = PERIODS.find((p) => p.key === period)!;
  const sparklineValues = series.slice(-periodMeta.sparklineLength);

  const breachedAbove = threshold?.above !== undefined && price !== null && price >= threshold.above;
  const breachedBelow = threshold?.below !== undefined && price !== null && price <= threshold.below;
  const breached = breachedAbove || breachedBelow;

  return (
    <div className={`tile${breached ? " tile-alert" : ""}`}>
      <div className="tile-head">
        <div className="tile-head-left">
          <button
            type="button"
            className={`favorite-btn${isFavorite ? " active" : ""}`}
            onClick={() => onToggleFavorite(quote.symbol)}
            aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            aria-pressed={isFavorite}
          >
            {isFavorite ? "★" : "☆"}
          </button>
          <span className="tile-label">{label}</span>
        </div>
        <span className={`market-dot ${quote.marketOpen ? "open" : "closed"}`} title={quote.marketOpen ? "장중" : "장마감"}>
          {quote.marketOpen ? "장중" : "장마감"}
        </span>
      </div>

      {hasData ? (
        <>
          <div className="tile-value">
            {formatNumber(price!, quote.decimals)}
            {quote.suffix ? <span className="tile-suffix">{quote.suffix}</span> : null}
          </div>

          <div className="tile-row">
            <span className={`tile-delta ${positive ? "up" : "down"}`}>
              {positive ? "▲" : "▼"} {formatNumber(Math.abs(change!), quote.decimals)} (
              {Math.abs(changePercent!).toFixed(2)}%)
            </span>
            <Sparkline values={sparklineValues} positive={positive} />
          </div>

          {breached && (
            <div className="tile-alert-text">
              ⚠ 임계값 도달{breachedAbove ? ` (이상: ${threshold!.above})` : ""}
              {breachedBelow ? ` (이하: ${threshold!.below})` : ""}
            </div>
          )}
        </>
      ) : (
        <div className="tile-error">데이터를 불러올 수 없습니다{quote.error ? ` (${quote.error})` : ""}</div>
      )}
    </div>
  );
}
