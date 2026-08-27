import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "금융 지표 대시보드",
  description: "코스피, S&P500, 나스닥, 다우, 원달러 환율, WTI, 미국채 10년, 필라델피아 반도체, 금, 비트코인 실시간 대시보드",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
