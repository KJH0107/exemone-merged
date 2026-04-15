# 세션 복원 가이드 — exemone-clone

---

## 빠른 재시작 (로컬에 이미 있을 때)

```bash
cd C:\복사본
git pull
npx next dev -p 6062
```

→ http://localhost:6062

---

## Claude Code 세션 복원 순서

```
# Step 0 — 실제 최신 상태 확인 (필수, stale 방지)
git log --oneline -10

# Step 1 — 구조/현황 파악
CLAUDE.md 읽고 프로젝트 컨텍스트 파악해줘

# Step 2 — 작업 이력 파악 (선택)
WORK_LOG.md 읽어줘
```

> claude_0322.md / claude_0327.md 는 히스토리 참조용 — 현재 상태는 CLAUDE.md + git log 기준

---

## 처음 세팅 (새 PC / 초기화 후)

```bash
# 1. 클론
git clone https://github.com/KJH0107/exemone-clone.git C:\복사본

# 2. 설치
cd C:\복사본
npm install

# 3. 서버 실행
npx next dev -p 6062
```

---

## 포트 정리

| 포트 | 프로젝트 | 경로 |
|------|---------|------|
| **6062** | exemone-clone (이 앱) | `C:\복사본` |
| 6061 | exemone-guide (가이드 앱) | `C:\exemONE_guide\guide-app` |

---

## 컨텍스트 문서

| 문서 | 내용 | 필수 여부 |
|------|------|---------|
| `CLAUDE.md` | 구조/현황/주의사항 | ✅ 필수 |
| `WORK_LOG.md` | 2026-04-06 이후 작업 이력 전체 | 선택 |
| `claude_0327.md` | 히스토리 (2026-03-27 기준, stale) | 참조 전용 |

---

## 주의사항

- git 커밋은 반드시 `C:\복사본`에서만
- guide-app(`C:\exemONE_guide\guide-app`)에 Sidebar/layout 복사 금지
  (guide-app에 GuideToggleButton, GuidePanelLayout 있음)

---

## GitHub

- 이 레포: https://github.com/KJH0107/exemone-clone
- guide 레포: https://github.com/KJH0107/exemone-guide
