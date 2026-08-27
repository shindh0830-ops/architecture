"use client";

import Sparkline from "./Sparkline";
import type { Quote } from "./api/quotes/route";

function formatNumber(value: number, decimals: number) {
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function StatTile({ quote }: { quote: Quote }) {
  const { label, price, change, changePercent, series, decimals, suffix } = quote;
  const hasData = price !== null && change !== null && changePercent !== null;
  const positive = (change ?? 0) >= 0;

  return (
    <div className="tile">
      <div className="tile-head">
        <span className="tile-label">{label}</span>
        <span className="tile-badge">{quote.category}</span>
      </div>

      {hasData ? (
        <>
          <div className="tile-value">
            {formatNumber(price!, decimals)}
            {suffix ? <span className="tile-suffix">{suffix}</span> : null}
          </div>

          <div className="tile-row">
            <span className={`tile-delta ${positive ? "up" : "down"}`}>
              {positive ? "▲" : "▼"} {formatNumber(Math.abs(change!), decimals)} (
              {Math.abs(changePercent!).toFixed(2)}%)
            </span>
            <Sparkline values={series} positive={positive} />
          </div>
        </>
      ) : (
        <div className="tile-error">데이터를 불러올 수 없습니다{quote.error ? ` (${quote.error})` : ""}</div>
      )}
    </div>
  );
}
