/**
 * API 엔드포인트 정의 — 스켈레톤
 *
 * 현재 모든 함수는 mock 데이터를 반환합니다.
 * TODO: 각 함수 본문을 실제 apiGet / apiPost 호출로 교체하면 됩니다.
 *
 * 사용 예:
 *   const instances = await fetchInstances()
 *   → mock 단계: mockInstances 반환
 *   → API 단계:  apiGet<DbInstance[]>('/api/instances')
 */

import type { DbInstance } from '@/types/db.types'
import { mockInstances } from '@/lib/mock/instances'
import {
  mockMetric,
  mockSessionDist,
  mockTopSql,
  mockTopEvent,
  mockSlowQuery,
  mockTablespace,
  mockReplication,
} from '@/lib/mock/db-metrics'

// ── 인스턴스 ─────────────────────────────────────
export async function fetchInstances(): Promise<DbInstance[]> {
  // TODO: return apiGet<DbInstance[]>('/api/instances')
  return Promise.resolve(mockInstances)
}

export async function fetchInstance(id: string): Promise<DbInstance | undefined> {
  // TODO: return apiGet<DbInstance>(`/api/instances/${id}`)
  return Promise.resolve(mockInstances.find(i => i.id === id))
}

// ── DB 메트릭 ─────────────────────────────────────
export async function fetchDbMetric(_instanceId: string) {
  // TODO: return apiGet(`/api/instances/${_instanceId}/metrics/current`)
  return Promise.resolve(mockMetric)
}

export async function fetchSessionDist(_instanceId: string) {
  // TODO: return apiGet(`/api/instances/${_instanceId}/sessions/distribution`)
  return Promise.resolve(mockSessionDist)
}

export async function fetchTopSql(_instanceId: string, _limit = 5) {
  // TODO: return apiGet(`/api/instances/${_instanceId}/sql/top?limit=${_limit}`)
  return Promise.resolve(mockTopSql)
}

export async function fetchTopEvent(_instanceId: string, _limit = 5) {
  // TODO: return apiGet(`/api/instances/${_instanceId}/events/top?limit=${_limit}`)
  return Promise.resolve(mockTopEvent)
}

export async function fetchSlowQuery(_instanceId: string) {
  // TODO: return apiGet(`/api/instances/${_instanceId}/sql/slow`)
  return Promise.resolve(mockSlowQuery)
}

export async function fetchTablespace(_instanceId: string) {
  // TODO: return apiGet(`/api/instances/${_instanceId}/tablespace`)
  return Promise.resolve(mockTablespace)
}

export async function fetchReplication(_instanceId: string) {
  // TODO: return apiGet(`/api/instances/${_instanceId}/replication`)
  return Promise.resolve(mockReplication)
}

// ── 성능 분석 ─────────────────────────────────────
export async function fetchTrendSeries(
  _instanceId: string,
  _metric: string,
  _timeRange: string,
) {
  // TODO: return apiGet(`/api/instances/${_instanceId}/metrics/trend?metric=${_metric}&range=${_timeRange}`)
  // TODO: mock 데이터는 performance/database/page.tsx 의 genTrendSeries() 참조
  return Promise.resolve([] as [number, number][])
}

export async function fetchScatterData(
  _instanceId: string,
  _timeRange: string,
) {
  // TODO: return apiGet(`/api/instances/${_instanceId}/transactions/scatter?range=${_timeRange}`)
  // TODO: mock 데이터는 performance/database/page.tsx 의 genScatterData() 참조
  return Promise.resolve([] as [number, number][])
}

// ── 알림 ─────────────────────────────────────────
export async function fetchAlertRules() {
  // TODO: return apiGet('/api/alerts/rules')
  return Promise.resolve([])
}

export async function fetchAlertEvents(_params?: { severity?: string; status?: string }) {
  // TODO: return apiGet(`/api/alerts/events?${new URLSearchParams(_params).toString()}`)
  return Promise.resolve([])
}
