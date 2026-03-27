# Claude 세션 컨텍스트 — 2026-03-27

> 이 파일은 Claude가 이전 작업 내용을 기억하기 위한 컨텍스트 문서입니다.
> 새 세션 시작 시 "claude_0327.md 읽어줘" 라고 하면 컨텍스트가 복원됩니다.

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | exemONE DB 모니터링 플랫폼 클론 |
| 원본 기술 | Vue 3 (exemONE 사) |
| 클론 기술 | Next.js 14 + TypeScript |
| 클론 대상 | 홈 / 대시보드 / 데이터베이스 / 성능분석 4개 영역 |
| **메인 작업 경로** | `C:\복사본` ← 실제 git 레포, 여기서 작업 |
| **참조/미러 경로** | `C:\exemONE_Crawling\exemone-clone` ← 서버 구동용 (복사본과 동기화) |
| GitHub | https://github.com/KJH0107/exemone-clone (private) |

> ⚠️ 중요: 실제 git 커밋은 `C:\복사본`에서만 이루어짐. `C:\exemONE_Crawling\exemone-clone`은 별도 git 레포 아님.

---

## 디렉터리 구조

```
C:\복사본\
├── src/
│   ├── app/
│   │   ├── home/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── database/page.tsx       ← Lock 탭 + 알람 탭 포함
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
├── claude_0322.md
└── claude_0327.md        ← 이 파일
```

---

## Git 커밋 이력 (전체)

| Hash | 내용 |
|------|------|
| `a250e76` | feat: 알람 정보 탭 구현 (룰 데이터 + 알림 섹션) |
| `dbbcffe` | feat: 알람 탭 구현 (룰 목록 + 실시간 상세 뷰) |
| `941ad4c` | feat: Lock 정보 탭 — FilterBar, Multi Kill, 다중 홀더 구현 |
| `aaf6ff0` | docs: 2026-03-22 세션 컨텍스트 문서 추가 (claude_0322.md) |
| `13627fd` | initial commit — exemONE DB monitoring clone (Next.js 14 + TypeScript) |

---

## 구현 완료 기능 (database/page.tsx 기준)

### 탭 구조
- Overview (CPU/Memory/Session/TPS 메트릭)
- 통계 & 이벤트 (Top SQL, Top Event)
- SQL & Query 오류 (Slow Query)
- 어드민 참조 (Tablespace, Replication)
- **Lock 정보** ← 구현 완료 (FilterBar, Multi Kill, 다중 홀더)
- **알람** ← 구현 완료 (룰 목록 + 실시간 상세 뷰)
- **알람 정보** ← 구현 완료 (룰 데이터 + 알림 섹션)

---

## 오늘 세션 (2026-03-27) 주요 작업

### 1. 레포 위치 재확인
- 실제 git 레포가 `C:\exemONE_Crawling\exemone-clone`이 아닌 `C:\복사본`임을 확인
- `C:\exemONE_Crawling\exemone-clone`은 git 레포 아님 (.git 없음)

### 2. 두 디렉토리 동기화
- `diff -rq`로 비교 → `database/page.tsx` 1개만 차이 있음
- `C:\복사본\src\app\database\page.tsx` → `C:\exemONE_Crawling\exemone-clone\src\app\database\page.tsx` 복사
- 동기화 후 6060 포트 정상 동작 확인

### 3. 서버 구동
- `C:\exemONE_Crawling\exemone-clone`에서 `npx next dev -p 6060` 실행
- http://localhost:6060 정상 접근 확인

---

## 서버 실행 정보

| 포트 | 경로 | 용도 |
|------|------|------|
| 6060 | `C:\exemONE_Crawling\exemone-clone` | 메인 개발 서버 |

### 실행 명령
```bash
cd C:\exemONE_Crawling\exemone-clone
npx next dev -p 6060
```

---

## Git 워크플로

| 트리거 | 동작 |
|--------|------|
| `"git 올려줘"` 또는 `"커밋해줘"` | status → diff → commit → push 자동 진행 |

### 커밋 대상 레포
```
C:\복사본  →  https://github.com/KJH0107/exemone-clone
```

### 커밋 메시지 컨벤션
```
feat:     기능 추가
fix:      버그 수정
refactor: 코드 정리
style:    UI/스타일 변경
docs:     문서 변경
```

---

## Claude 트리거 규칙

| 트리거 | 동작 |
|--------|------|
| `gsd` 로 시작 | GSD 스킬 실행 — `▶ CLAUDE` / `◀ GSD` 반박 형식 |
| `프젝변` | 최신 vN.html 파악 → 수정 → v(N+1) 저장 → MD 업데이트 |
| `git 올려줘` / `커밋해줘` | git add → commit → push 자동 실행 |

---

## 다음 작업 후보

- [ ] 성능분석 페이지 구현 (트렌드 분석 / Scatter / AI 이상탐지)
- [ ] 홈 위젯 드래그 앤 드롭 구현 (react-grid-layout)
- [ ] 대시보드 빌더 위젯 타입 확장
- [ ] ECharts 지표 확장
- [ ] HTML 변환 파일 추가 기능 (SQL Plan 탭 등)

---

*마지막 업데이트: 2026-03-27*
