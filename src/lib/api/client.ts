/**
 * API 클라이언트 — fetch 레이어 스켈레톤
 *
 * TODO: 실제 API 연동 시
 *   1. .env.local 에서 NEXT_PUBLIC_API_BASE_URL 설정
 *   2. 각 함수의 mock return 을 실제 fetch 호출로 교체
 *   3. 인증 헤더 (Bearer token 등) 추가
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

// ── 공통 fetch 래퍼 ────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      // TODO: Authorization: `Bearer ${getToken()}`
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`API Error ${res.status}: ${err}`)
  }

  return res.json() as Promise<T>
}

export const apiGet  = <T>(path: string) => apiFetch<T>(path)
export const apiPost = <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) })
export const apiPut  = <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'PUT',  body: JSON.stringify(body) })
export const apiDel  = <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' })
