# Claude 세션 컨텍스트 — 2026-03-22

> 이 파일은 Claude가 이전 작업 내용을 기억하기 위한 컨텍스트 문서입니다.
> 새 세션 시작 시 "claude_0322.md 읽어줘" 라고 하면 컨텍스트가 복원됩니다.

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | exemONE DB 모니터링 플랫폼 클론 |
| 원본 기술 | Vue 3 (exemONE 사) |
| 클론 기술 | Next.js 14 + TypeScript |
| 클론 대상 | 홈 / 대시보드 / 데이터베이스 / 성능분석 4개 영역 |
| 작업 경로 | `C:\복사본` (메인 작업 폴더) |
| GitHub | https://github.com/KJH0107/exemone-clone (private) |
| 참조 소스 | `C:\exemONE_Crawling\exemone-clone\src\` |

---

## 디렉터리 구조

```
C:\복사본\
├── src/
│   ├── app/
│   │   ├── home/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── database/page.tsx
│   │   ├── alert/page.tsx
│   │   ├── performance/database/page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/       Sidebar.tsx, Header.tsx
│   │   ├── database/     FilterPanel, HexagonGrid, InstanceTable, MetricCard 등
│   │   ├── charts/       DonutChart, LineChart, SessionBar
│   │   └── common/       ExportButton
│   ├── lib/
│   │   ├── api/          client.ts, endpoints.ts
│   │   └── mock/         instances.ts, db-metrics.ts
│   ├── stores/
│   └── types/            db.types.ts
├── .gitignore
├── package.json
├── tailwind.config.js
├── next.config.js
└── claude_0322.md        ← 이 파일
```

---

## 병행 작업: HTML 단일 파일 변환

| 항목 | 내용 |
|------|------|
| 목적 | Next.js 앱을 standalone HTML 한 파일로 복제 |
| 작업 경로 | `C:\260318\` |
| 최신 파일 | `plz_0318_v2.html` |
| 문서 | `C:\260318\PROJECT_HTML_CONVERT.md` |
| 기술 | Vanilla JS + ECharts CDN (프레임워크 없음) |

### HTML 변환 버전 이력
| 파일 | 주요 변경 |
|------|-----------|
| `plz_0318.html` | 기반 파일 — 8개 드로어 탭 기본 구조 |
| `plz_0318_v1.html` | FilterBar 구현, SQL Detail 서브탭, position:fixed 드롭다운 |
| `plz_0318_v2.html` | FilterBar 클릭 무반응 버그 수정 (e.composedPath 적용) |

---

## 오늘 세션에서 해결한 주요 버그

### 1. FilterBar 클릭해도 반응 없음
**원인**: `fbClick()` 실행 시 `c.innerHTML = fbHtml()` 로 DOM 교체 → 원래 클릭한 `.fb` 요소가 분리됨 → document click 리스너에서 `c.contains(e.target) = false` → 즉시 `fbReset()` 호출 → 드롭다운 열리자마자 닫힘

**해결**: `c.contains(e.target)` → `e.composedPath().includes(c)` 로 교체 (DOM 교체 후에도 이벤트 경로 보존)

### 2. FilterBar 드롭다운 overflow 클리핑
**원인**: `#dr-body { overflow:auto }` 가 `position:absolute` 드롭다운을 잘라냄

**해결**: `.fb-drop { position:fixed; z-index:9999 }` + `positionFbDrop()` 함수로 `getBoundingClientRect()` 기반 동적 위치 계산

### 3. fbNavTo hover 시 드롭다운 깜빡임
**원인**: `onmouseenter` 마다 `fbRerender()` 전체 DOM 재빌드 + `positionFbDrop()` 반복 호출

**해결**: `fbNavTo`는 `.nav` 클래스 토글만, `fbRerender` 없이 처리

---

## 서버 실행 정보

| 포트 | 경로 | 용도 |
|------|------|------|
| 3000 | `C:\exemONE_Crawling\exemone-clone` | 원본 참조용 |
| 6060 | `C:\복사본` | 메인 개발 서버 |

### 6060 포트 실행 명령
```bash
cd C:\복사본
npx next dev -p 6060
```

---

## Git 워크플로

| 트리거 | 동작 |
|--------|------|
| `"git 올려줘"` 또는 `"커밋해줘"` | status → diff → commit → push 자동 진행 |

### 커밋 메시지 컨벤션
```
feat:     기능 추가
fix:      버그 수정
refactor: 코드 정리
style:    UI/스타일 변경
```

---

## Claude 트리거 규칙 (메모리)

| 트리거 | 동작 |
|--------|------|
| `gsd` 로 시작 | GSD 스킬 실행 — `▶ CLAUDE` / `◀ GSD` 반박 형식 |
| `프젝변` | 최신 vN.html 파악 → 수정 → v(N+1) 저장 → MD 업데이트 |
| `git 올려줘` / `커밋해줘` | git add → commit → push 자동 실행 |

---

## 다음 작업 후보

- [ ] Next.js 앱 미구현 기능 추가 (복사본 기준)
- [ ] HTML 변환 파일 추가 기능 구현 (SQL Plan 탭 등)
- [ ] 성능분석 페이지 구현
- [ ] ECharts 지표 확장

---

*마지막 업데이트: 2026-03-22*
