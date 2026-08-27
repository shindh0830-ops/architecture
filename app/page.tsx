"use client";

import { useEffect, useState, useCallback } from "react";
import StatTile from "./StatTile";
import type { Quote } from "./api/quotes/route";

const REFRESH_MS = 20_000;

export default function Home() {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/quotes", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setQuotes(data.quotes);
      setUpdatedAt(data.updatedAt);
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "불러오기에 실패했습니다");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount, refreshed on an interval
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const categories = quotes
    ? Array.from(new Set(quotes.map((q) => q.category)))
    : [];

  return (
    <main className="page">
      <header className="page-header">
        <h1>금융 지표 대시보드</h1>
        <div className="page-meta">
          {updatedAt
            ? `업데이트: ${new Date(updatedAt).toLocaleTimeString("ko-KR")}`
            : "불러오는 중..."}
          {errorMsg ? <span className="page-error"> · {errorMsg}</span> : null}
        </div>
      </header>

      {!quotes ? (
        <div className="loading">데이터를 불러오는 중입니다...</div>
      ) : (
        categories.map((category) => (
          <section key={category} className="category-section">
            <h2 className="category-title">{category}</h2>
            <div className="tile-grid">
              {quotes
                .filter((q) => q.category === category)
                .map((q) => (
                  <StatTile key={q.symbol} quote={q} />
                ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
