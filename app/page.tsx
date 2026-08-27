"use client";

import { useEffect, useState, useCallback } from "react";
import StatTile from "./StatTile";
import SettingsPanel from "./SettingsPanel";
import ThemeToggle from "./ThemeToggle";
import type { Quote, PeriodKey } from "./lib/symbols";
import { PERIODS } from "./lib/symbols";
import { loadPrefs, savePrefs, DEFAULT_PREFS, type Prefs } from "./lib/prefs";

export default function Home() {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [period, setPeriod] = useState<PeriodKey>("day");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only reachable client-side, after mount
    setPrefs(loadPrefs());
    setPrefsLoaded(true);
  }, []);

  const updatePrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    savePrefs(next);
  }, []);

  useEffect(() => {
    if (!prefsLoaded) return;
    const root = document.documentElement;
    if (prefs.theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", prefs.theme);
  }, [prefs.theme, prefsLoaded]);

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
    const id = setInterval(load, prefs.refreshMs);
    return () => clearInterval(id);
  }, [load, prefs.refreshMs]);

  const toggleFavorite = useCallback(
    (symbol: string) => {
      const isFav = prefs.favorites.includes(symbol);
      updatePrefs({
        ...prefs,
        favorites: isFav ? prefs.favorites.filter((s) => s !== symbol) : [...prefs.favorites, symbol],
      });
    },
    [prefs, updatePrefs]
  );

  const orderIndex = (symbol: string) => {
    const i = prefs.order.indexOf(symbol);
    return i === -1 ? prefs.order.length : i;
  };

  const sortedQuotes = quotes
    ? [...quotes].sort((a, b) => orderIndex(a.symbol) - orderIndex(b.symbol))
    : [];

  const favoriteQuotes = sortedQuotes.filter((q) => prefs.favorites.includes(q.symbol));
  const categories = Array.from(new Set(sortedQuotes.map((q) => q.category)));

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header-top">
          <h1>금융 지표 대시보드</h1>
          <div className="page-header-actions">
            <ThemeToggle theme={prefs.theme} onChange={(theme) => updatePrefs({ ...prefs, theme })} />
            <button type="button" className="settings-btn" onClick={() => setSettingsOpen(true)}>
              ⚙ 설정
            </button>
          </div>
        </div>
        <div className="page-meta">
          {updatedAt
            ? `업데이트: ${new Date(updatedAt).toLocaleTimeString("ko-KR")}`
            : "불러오는 중..."}
          {errorMsg ? <span className="page-error"> · {errorMsg}</span> : null}
        </div>

        <div className="period-tabs" role="tablist" aria-label="기간 선택">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={period === p.key}
              className={`period-tab${period === p.key ? " active" : ""}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {!quotes ? (
        <div className="loading">데이터를 불러오는 중입니다...</div>
      ) : (
        <>
          {favoriteQuotes.length > 0 && (
            <section className="category-section">
              <h2 className="category-title">★ 즐겨찾기</h2>
              <div className="tile-grid">
                {favoriteQuotes.map((q) => (
                  <StatTile
                    key={q.symbol}
                    quote={q}
                    period={period}
                    isFavorite
                    onToggleFavorite={toggleFavorite}
                    threshold={prefs.thresholds[q.symbol]}
                  />
                ))}
              </div>
            </section>
          )}

          {categories.map((category) => (
            <section key={category} className="category-section">
              <h2 className="category-title">{category}</h2>
              <div className="tile-grid">
                {sortedQuotes
                  .filter((q) => q.category === category)
                  .map((q) => (
                    <StatTile
                      key={q.symbol}
                      quote={q}
                      period={period}
                      isFavorite={prefs.favorites.includes(q.symbol)}
                      onToggleFavorite={toggleFavorite}
                      threshold={prefs.thresholds[q.symbol]}
                    />
                  ))}
              </div>
            </section>
          ))}
        </>
      )}

      <SettingsPanel
        open={settingsOpen}
        prefs={prefs}
        onChange={updatePrefs}
        onClose={() => setSettingsOpen(false)}
      />
    </main>
  );
}
