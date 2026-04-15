# exemONE Clone — 세션 컨텍스트

## 이 앱이 무엇인가

exemONE DB 모니터링 플랫폼(Vue3)을 Next.js 14 + TypeScript로 클론한 앱.
**guide-app(`C:\exemONE_guide\guide-app`)의 UI 기반**이 되는 레포.

- GitHub: https://github.com/KJH0107/exemone-clone
- 로컬 경로: `C:\복사본` (git 커밋/push 여기서만)
- 서버 포트: 6062 → http://localhost:6062

---

## 실행

```bash
cd C:\복사본
npx next dev -p 6062
```

---

## 기술 스택

- Next.js 14 (App Router) + TypeScript
- Zustand, ECharts, Tailwind CSS
- 인라인 스타일 + CSS 변수 (`data-theme="light"`)
- 로컬 폰트: Pretendard + JetBrainsMono (`public/fonts/`)

---

## 구현 완료 페이지

| 경로 | 내용 |
|------|------|
| `/home` | 위젯 대시보드, 시작 가이드 온보딩 |
| `/dashboard` | 대시보드 목록 |
| `/database` | HexagonGrid + InstanceTable + InstanceDrawer (8탭) |
| `/alert` | 알람 현황 + 알람 규칙 + 알람 정보 탭 |
| `/performance/database` | Scatter, Trend 분석 |
| `/db/postgresql/single` | PostgreSQL 싱글뷰 (3컬럼 레이아웃) |

---

## 미완료 (남은 작업)

### 라우트 404 상태

| 경로 | 내용 |
|------|------|
| `/db/postgresql/dashboard` | PostgreSQL 대시보드 |
| `/db/postgresql/multi` | 멀티뷰 |
| `/db/postgresql/top-n` | Top N Analysis |
| `/db/postgresql/search-sql` | Search SQL |
| `/db/postgresql/search-session` | Search Session |
| `/db/postgresql/trend` | Trend Analysis |
| `/db/postgresql/parameter` | Parameter History |
| `/db/postgresql/object-size` | Object Size |

### 싱글뷰 잔여 개선
- HexGrid 세션 데이터 바인딩 (현재 더미 색상)
- Session Tab `left:220` 하드코딩 → CSS 변수

---

## 핵심 파일

| 파일 | 설명 |
|------|------|
| `src/app/database/page.tsx` | 오버뷰 + InstanceDrawer |
| `src/app/db/postgresql/single/page.tsx` | PostgreSQL 싱글뷰 |
| `src/components/layout/Sidebar.tsx` | DATABASE 계층 사이드바 |
| `src/app/styles/` | theme_light/dark.css, typography-v2.css |
| `WORK_LOG.md` | 전체 작업 이력 (2026-04-06 이후) |

---

## 스타일 시스템

- CSS 변수 기반 라이트 테마 (`layout.tsx` → `data-theme="light"`)
- `src/app/styles/theme_light.css` — `--color-w-gray-*` 토큰 시스템 사용
- **guide-app에 이 테마 CSS 복사 금지** — 토큰 의존성으로 guide-app에서 작동 안 함

---

## 데모 사이트

- URL: https://demo3.exemone.com
- ID: master / PW: @dprtpadnjs12!@

---

## 관련 레포

- guide-app: https://github.com/KJH0107/exemone-guide (포트 6061)
