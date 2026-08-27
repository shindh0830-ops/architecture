# 금융 지표 대시보드

개인용 실시간 금융 지표 대시보드입니다. Next.js App Router 기반이며, 서버 라우트
핸들러(`/api/quotes`)가 Yahoo Finance의 공개 시세 API에서 데이터를 가져와
브라우저가 20초마다 폴링합니다.

## 표시 지표

| 지표 | 심볼 |
|---|---|
| 코스피 | `^KS11` |
| S&P 500 | `^GSPC` |
| 나스닥 | `^IXIC` |
| 다우존스 | `^DJI` |
| 필라델피아 반도체지수 | `^SOX` |
| 원/달러 환율 | `KRW=X` |
| WTI 원유 | `CL=F` |
| 금(Gold) | `GC=F` |
| 미국채 10년 금리 | `^TNX` |
| 비트코인 | `BTC-USD` |

지표 구성은 `app/api/quotes/route.ts`의 `SYMBOLS` 배열에서 수정할 수 있습니다.

## 로컬 실행

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인합니다.

## Vercel 배포

1. 이 저장소를 GitHub에 두고 [vercel.com/new](https://vercel.com/new)에서 Import
2. 별도 환경변수나 설정 없이 바로 배포 가능 (Next.js 프레임워크 자동 인식)
3. 배포 후 발급되는 URL로 어디서든 접속

## 참고 사항

- Yahoo Finance 비공식 공개 엔드포인트를 사용하므로 요청이 많거나 정책이
  바뀌면 일시적으로 데이터를 못 가져올 수 있습니다. 이 경우 해당 카드에
  "데이터를 불러올 수 없습니다"가 표시되고, 다음 폴링 주기에 자동 재시도합니다.
- 개인용으로 인증/로그인은 두지 않았습니다. 외부에 공유하지 않는 것을 권장합니다.
