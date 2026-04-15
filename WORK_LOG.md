# exemONE Clone — 작업 로그

> 기준 프로젝트: `C:\복사본` (Next.js 14 + TypeScript)  
> 데모 사이트: https://demo3.exemone.com (ID: master / PW: @dprtpadnjs12!@)  
> 참조 레포: https://github.com/KJH0107/exemone-clone  
> 로컬 개발서버: **http://localhost:6062**

---

## 로컬 확인 링크

| 페이지 | URL | 상태 |
|--------|-----|------|
| 홈 | http://localhost:6062 | ✅ |
| 데이터베이스 오버뷰 | http://localhost:6062/database | ✅ |
| PostgreSQL 싱글뷰 | http://localhost:6062/db/postgresql/single | ✅ (주요 작업) |
| 대시보드 | http://localhost:6062/dashboard | ✅ |
| 성능분석 | http://localhost:6062/performance/database | ✅ |
| 알람 | http://localhost:6062/alert | ✅ |

---

## 2026-04-06 (피씨 뻑 복구 이후 세션)

### [FIX] typography-v2.css 500 에러 해결
- **원인**: CSS `url()` 안에서 Vue alias `@/common/assets/fonts/...` 사용 → Next.js public 경로에서 해석 불가
- **수정**: 5개 `@font-face` src를 `/fonts/Pretendard/...`, `/fonts/JetBrainsMono/...` 로 변경
- **파일**: `src/app/styles/typography-v2.css`

---

### [FEAT] 데이터베이스 오버뷰 페이지 (`/database`) 레이아웃
- **내용**: HexagonGrid + InstanceTable 동시 표시 (탭 방식 제거)
- **파일**: `src/app/database/page.tsx`

---

### [FEAT] 사이드바 전면 재설계 (`Sidebar.tsx`)

```
홈 / 대시보드                   → 독립 최상단 항목
────────────────────────────────
DATABASE
  오버뷰                        → /database
  PostgreSQL  ▼                 → 서브메뉴 6개
    대시보드 / 멀티뷰 / 싱글뷰
    SQL분석 / 세션분석 / 성능분석 / 데이터영역분석
  MySQL / Oracle / SQL Server
  MongoDB / Tibero / Cubrid / Altibase
    (각각 독립 카테고리, 준비 중)
────────────────────────────────
성능분석 / 알람
```

- **파일**: `src/components/layout/Sidebar.tsx`

---

### [FEAT] PostgreSQL 싱글뷰 신규 생성 (`/db/postgresql/single`)

#### 레이아웃: 3컬럼 (Left 540px / Center flex / Right 540px)

| 섹션 | 위치 | 내용 |
|------|------|------|
| Grouping Summary 헤더 | LEFT 상단 | 섹션 라벨 |
| Statistics & Events | LEFT | Top Diff Statistics(Sum) for 10min + Top Event for 10min 가로 2테이블 |
| SQL & Function | LEFT | Top SQL for 10min Order By Temp Blks Read + Top Function for 10min Order By Total Time |
| Object | LEFT | Index Scan vs. Table Scan VS 도넛 + Top Object for 10min 수평 바차트 |
| Trend Summary | LEFT | DB Stat: Tup Updated (count) + DB Stat: (OS) Cpu Usage (%) 바차트 2개 |
| Overview | CENTER | DB 인스턴스 정보 + Connection 게이지(도넛) + HexGrid + 4 상태카드 + Buffer Cache Hit Ratio |
| Admin Reference | CENTER | Vacuum(기본 펼침) / Alert Logs / Additional Information 접기패널 |
| Real Time Monitor 헤더 | RIGHT | 섹션 라벨 |
| Slow Query | RIGHT | 라인차트 (Max Elapsed Count / Duration) |
| Blks Hit / Blks Read / TPS / Rows Hit Ratio | RIGHT | 라인차트 4개 |
| Session Tab | 하단 고정 | 슬라이드업 세션 테이블 (Active/Idle/Wait 카운트) |

#### CENTER 4 상태카드 서브라벨 (데모 맞춤)

| 카드 | 서브항목 |
|------|---------|
| Alert | Critical / Warning / Total |
| Vacuum | Current Age / Usable Age / Age Used |
| Replication | Primary / Stand By / Lag |
| Check Point | Backend Write / Avg Write / Avg Write Time |

#### Admin Reference - Vacuum 내용
- Top Dead Tuple for Object (수평 바차트)
- Top Vacuuming Process (sec) (테이블)

---

### [FIX] 라이트 테마 적용
- 전체 스타일을 CSS 변수 기반으로 전환
- `layout.tsx`에 `data-theme="light"` 적용 확인

---

### [FIX] 성능 최적화
- `useClock` 전체 리렌더 → `LiveClock` 독립 컴포넌트 분리
- `genScatterData()` 모듈 레벨 상수로 처리

---

### [TOOL] 데모 사이트 Playwright 자동 캡처 환경
- 위치: `/tmp/pw_test/` (playwright npm 패키지 설치)
- 로그인: master / @dprtpadnjs12!@
- 성공 패턴: 로그인 → 3초 대기 → 목표 페이지 이동 → 8초 대기 → tutorial-guide JS 제거 → 스크린샷
- demo/admin 계정: 잘못된 PW 다수 시도로 잠금 처리됨 → master 계정만 사용

---

## 데모 vs 클론 실측 비교 (Playwright 기준, 1920×1080)

### 싱글뷰 컬럼 크기

| | 데모 | 클론 |
|---|---|---|
| 사이드바 | 48px | 220px |
| LEFT | 594px | 541px |
| CENTER | 668px | 602px |
| RIGHT | 594px | 540px |

### 오버뷰 구조 (현재 원본 유지 중)
- **주의**: 오버뷰는 2026-04-08 사용자 요청으로 git HEAD 상태로 복원됨
- 이유: 데모와 구조 차이가 커서(그룹 테이블, 검색 방식 등) 별도 검토 필요

---

## 남은 작업

### 라우트 페이지 생성 (404 상태)

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

| 우선순위 | 항목 | 상태 |
|----------|------|------|
| P2 | HexGrid 세션 데이터 바인딩 (현재 더미 색상) | ⏳ |
| P3 | Session Tab `left:220` 하드코딩 → CSS 변수 | ⏳ |

---

## 파일 구조 현황

```
src/
├── app/
│   ├── layout.tsx                      data-theme="light" 설정
│   ├── globals.css                     theme_light/dark import
│   ├── database/
│   │   └── page.tsx                    HexGrid + InstanceTable (git HEAD 원본)
│   ├── db/postgresql/
│   │   └── single/
│   │       └── page.tsx                싱글뷰 (3컬럼, 데모 맞춤 콘텐츠)
│   └── styles/
│       ├── typography-v2.css           폰트 경로 fix 완료
│       ├── theme_light.css
│       └── theme_dark.css
└── components/
    ├── layout/
    │   └── Sidebar.tsx                 독립 카테고리 구조
    └── database/
        ├── InstanceTable.tsx           git HEAD 원본 (flat 목록)
        ├── SummaryBar.tsx              git HEAD 원본
        ├── HexagonGrid.tsx
        ├── FilterPanel.tsx
        └── SummaryBar.tsx
```
