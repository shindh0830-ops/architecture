"use client";

import Sparkline from "./Sparkline";
import type { Quote, PeriodKey } from "./lib/symbols";
import { PERIODS } from "./lib/symbols";
import type { Currency } from "./lib/prefs";
import { displayPrice, formatNumber } from "./lib/format";

interface MetricsTableProps {
  quotes: Quote[];
  period: PeriodKey;
  favorites: string[];
  onToggleFavorite: (symbol: string) => void;
  onOpenDetail: (symbol: string) => void;
  currency: Currency;
  usdKrwRate: number | null;
}

export default function MetricsTable({
  quotes,
  period,
  favorites,
  onToggleFavorite,
  onOpenDetail,
  currency,
  usdKrwRate,
}: MetricsTableProps) {
  const periodMeta = PERIODS.find((p) => p.key === period)!;

  return (
    <div className="table-card">
      <table className="metrics-table">
        <thead>
          <tr>
            <th style={{ width: 36 }} />
            <th>지수 / 자산명</th>
            <th>현재가</th>
            <th>변동금액</th>
            <th>등락률</th>
            <th>기간 고가 / 저가</th>
            <th>미니 차트</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => {
            const { price, series } = quote;
            const { change, changePercent } = quote.periods[period];
            const hasData = price !== null && change !== null && changePercent !== null;
            const positive = (change ?? 0) >= 0;
            const sparklineValues = series.slice(-periodMeta.sparklineLength);
            const isFavorite = favorites.includes(quote.symbol);
            const shown = hasData ? displayPrice(quote, price!, currency, usdKrwRate) : null;
            const high = sparklineValues.length ? Math.max(...sparklineValues) : null;
            const low = sparklineValues.length ? Math.min(...sparklineValues) : null;

            return (
              <tr key={quote.symbol} onClick={() => onOpenDetail(quote.symbol)}>
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`favorite-btn${isFavorite ? " active" : ""}`}
                    onClick={() => onToggleFavorite(quote.symbol)}
                    aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                  >
                    {isFavorite ? "★" : "☆"}
                  </button>
                </td>
                <td>
                  <strong>{quote.label}</strong>
                </td>
                {hasData ? (
                  <>
                    <td>
                      {formatNumber(shown!.value, quote.decimals)}
                      {shown!.suffix ? ` ${shown!.suffix}` : ""}
                    </td>
                    <td className={positive ? "tile-delta up" : "tile-delta down"}>
                      {positive ? "+" : ""}
                      {formatNumber(change!, quote.decimals)}
                    </td>
                    <td className={positive ? "tile-delta up" : "tile-delta down"}>
                      {positive ? "▲" : "▼"} {Math.abs(changePercent!).toFixed(2)}%
                    </td>
                    <td>
                      {high !== null && low !== null
                        ? `${formatNumber(high, quote.decimals)} / ${formatNumber(low, quote.decimals)}`
                        : "-"}
                    </td>
                    <td>
                      <Sparkline
                        values={sparklineValues}
                        positive={positive}
                        width={110}
                        height={32}
                        id={`table-${quote.symbol}`}
                      />
                    </td>
                  </>
                ) : (
                  <td colSpan={4} className="tile-error">
                    데이터 없음
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
