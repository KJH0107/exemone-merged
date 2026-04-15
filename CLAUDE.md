# exemONE Merged — 세션 컨텍스트

## 이 앱이 무엇인가

exemONE DB 모니터링 플랫폼 클론(UI) + 인터랙티브 기능 가이드 패널을 **하나로 합친 통합 앱**.
6062(clone)와 6061(guide-app)을 별도로 운영하던 것을 단일 앱으로 통합.

- **GitHub: https://github.com/KJH0107/exemone-merged**
- 로컬 경로: `C:\exemone-merged` (git 커밋/push 여기서만)
- **서버 포트: 6063 → http://localhost:6063**

---

## 실행

```bash
cd C:\exemone-merged
npm run dev
```

---

## 기술 스택

- Next.js 14 (App Router) + TypeScript
- Zustand (guideStore + 일반 상태), ECharts, Tailwind CSS
- 인라인 스타일 + CSS 변수 (`data-theme="light"`)
- 로컬 폰트: Pretendard + JetBrainsMono (`public/fonts/`)

---

## 가이드 시스템 구조

| 파일 | 역할 |
|------|------|
| `src/stores/guideStore.ts` | isOpen, activeFeature, isDrawerOpen, openDrawer/closeDrawer |
| `src/components/guide/GuidePanelLayout.tsx` | 우측 360px 가이드 패널, flex sibling |
| `src/components/guide/GuideHighlight.tsx` | box-shadow 하이라이트 래퍼, onClickCapture |
| `src/components/guide/GuideToggleButton.tsx` | Sidebar 내 가이드 열기 버튼 |
| `src/components/guide/ScenarioPanel.tsx` | 시나리오 선택 패널 |
| `src/lib/guide/features.ts` | 전체 기능 설명 데이터 (PageKey, FeatureItem, relatedFeatures) |
| `src/lib/mock/scenarios.ts` | 시나리오 목 데이터 |

### 가이드 연결 현황
| 페이지 | 기능 연결 | 비고 |
|--------|-----------|------|
| `/database` 오버뷰 | ✅ 4개 (filters, instance-card, instance-map, instance-list) | GuideHighlight 완료 |
| `/database` InstanceDrawer | ✅ 8개 탭 (drawer-info ~ drawer-host-process) | 탭↔가이드 양방향 동기화 |
| `/home` | ❌ 미연결 | |
| `/performance` | ❌ 미연결 | |
| `/alert` | ❌ 미연결 | |

---

## 구현 완료 페이지

| 경로 | 내용 |
|------|------|
| `/home` | 위젯 대시보드, 시작 가이드 온보딩 |
| `/dashboard` | 대시보드 목록 |
| `/database` | HexagonGrid + InstanceTable + InstanceDrawer (8탭) + 가이드 연결 완료 |
| `/alert` | 알람 현황 + 알람 규칙 + 알람 정보 탭 |
| `/performance/database` | Scatter, Trend 분석 |
| `/db/postgresql/single` | PostgreSQL 싱글뷰 (3컬럼 레이아웃) |

---

## 미완료 (남은 작업)

### 가이드 연결
- `/home`, `/performance`, `/alert` GuideHighlight 연결
- Session Detail / SQL Detail / Parameter Detail 슬라이드 가이드
- 단일 HTML 파일 변환 (장기)

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

---

## 핵심 파일

| 파일 | 설명 |
|------|------|
| `src/app/layout.tsx` | GuidePanelLayout flex sibling 배치 |
| `src/app/database/page.tsx` | 오버뷰 + InstanceDrawer + TAB_FEATURE_MAP + GuideHighlight |
| `src/components/layout/Sidebar.tsx` | DATABASE 계층 사이드바 + GuideToggleButton |
| `src/app/styles/` | theme_light/dark.css, typography-v2.css |

---

## 스타일 시스템

- CSS 변수 기반 라이트 테마 (`layout.tsx` → `data-theme="light"`)
- `src/app/styles/theme_light.css` — `--color-w-gray-*` 토큰 시스템
- Pretendard 폰트 `public/fonts/` 로컬 로드 (Google Fonts 미사용)

---

## 데모 사이트

- URL: https://demo3.exemone.com
- ID: master / PW: @dprtpadnjs12!@

---

## 참조 전용 레포 (수정 금지)

- clone: `C:\복사본` → https://github.com/KJH0107/exemone-clone (port 6062)
- guide-app: `C:\exemONE_guide\guide-app` → https://github.com/KJH0107/exemone-guide (port 6061)
