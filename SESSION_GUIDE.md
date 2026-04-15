# 세션 복원 가이드

## 빠른 시작 (이미 로컬에 있을 때)

```bash
git pull && npx next dev -p 6062
```

Claude 첫 마디: `WORK_LOG.md 읽고 프로젝트 컨텍스트 파악해줘`

---

## 처음 세팅 (새 PC / 초기화 후)

```bash
git clone https://github.com/KJH0107/exemone-clone.git C:\복사본
cd C:\복사본
npm install
npx next dev -p 6062
```

→ http://localhost:6062

```bash
cd C:\복사본
claude
```

**Claude 첫 마디:**
```
WORK_LOG.md 읽고 프로젝트 컨텍스트 파악해줘
```

---

## 포트 정리

| 포트 | 프로젝트 |
|------|---------|
| 6062 | exemone-clone (이 앱) |
| 6061 | exemone-guide (가이드 앱) |

---

## 관련 레포

- 이 레포: https://github.com/KJH0107/exemone-clone
- 가이드 앱: https://github.com/KJH0107/exemone-guide
