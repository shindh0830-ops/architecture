"use client";

import type { ThemeMode } from "./lib/prefs";

const NEXT: Record<ThemeMode, ThemeMode> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const ICON: Record<ThemeMode, string> = {
  system: "🖥️",
  light: "☀️",
  dark: "🌙",
};

const LABEL: Record<ThemeMode, string> = {
  system: "시스템",
  light: "라이트",
  dark: "다크",
};

export default function ThemeToggle({
  theme,
  onChange,
}: {
  theme: ThemeMode;
  onChange: (theme: ThemeMode) => void;
}) {
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => onChange(NEXT[theme])}
      title={`테마: ${LABEL[theme]} (클릭하여 전환)`}
    >
      <span aria-hidden="true">{ICON[theme]}</span> {LABEL[theme]}
    </button>
  );
}
