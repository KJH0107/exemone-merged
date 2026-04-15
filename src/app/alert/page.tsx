'use client'
import { useState } from 'react'
import Header from '@/components/layout/Header'
import { mockInstances } from '@/lib/mock/instances'

// ── 타입 ─────────────────────────────────────────
type Severity = 'critical' | 'warning' | 'info'
type AlertStatus = 'firing' | 'resolved' | 'acknowledged'

interface AlertRule {
  id: string
  name: string
  instanceId: string
  metric: string
  condition: '>' | '<' | '>=' | '<='
  threshold: number
  severity: Severity
  enabled: boolean
  notifyEmail: boolean
  notifySlack: boolean
}

interface AlertEvent {
  id: string
  ruleId: string
  ruleName: string
  instanceName: string
  metric: string
  value: number
  threshold: number
  severity: Severity
  status: AlertStatus
  firedAt: string
  resolvedAt?: string
}

// ── Mock 데이터 ───────────────────────────────────
const INITIAL_RULES: AlertRule[] = [
  { id: 'r1', name: 'CPU 임계치 초과', instanceId: mockInstances[0].id, metric: 'CPU Usage (%)', condition: '>', threshold: 85, severity: 'critical', enabled: true, notifyEmail: true, notifySlack: false },
  { id: 'r2', name: 'Memory 경고', instanceId: mockInstances[1].id, metric: 'Memory Usage (%)', condition: '>', threshold: 80, severity: 'warning', enabled: true, notifyEmail: true, notifySlack: true },
  { id: 'r3', name: 'TPS 급감', instanceId: mockInstances[0].id, metric: 'TPS', condition: '<', threshold: 50, severity: 'warning', enabled: false, notifyEmail: false, notifySlack: false },
  { id: 'r4', name: '세션 과부하', instanceId: mockInstances[2].id, metric: 'Active Sessions', condition: '>=', threshold: 200, severity: 'critical', enabled: true, notifyEmail: true, notifySlack: true },
  { id: 'r5', name: 'IOPS 모니터링', instanceId: mockInstances[3].id, metric: 'IOPS', condition: '>', threshold: 5000, severity: 'info', enabled: true, notifyEmail: false, notifySlack: false },
]

const MOCK_EVENTS: AlertEvent[] = [
  { id: 'e1', ruleId: 'r1', ruleName: 'CPU 임계치 초과', instanceName: mockInstances[0].name, metric: 'CPU Usage (%)', value: 94.2, threshold: 85, severity: 'critical', status: 'firing',     firedAt: '2026-03-14 14:23:11' },
  { id: 'e2', ruleId: 'r2', ruleName: 'Memory 경고',     instanceName: mockInstances[1].name, metric: 'Memory Usage (%)', value: 83.7, threshold: 80, severity: 'warning', status: 'resolved',   firedAt: '2026-03-14 13:55:40', resolvedAt: '2026-03-14 14:10:02' },
  { id: 'e3', ruleId: 'r4', ruleName: '세션 과부하',      instanceName: mockInstances[2].name, metric: 'Active Sessions', value: 214, threshold: 200, severity: 'critical', status: 'acknowledged', firedAt: '2026-03-14 13:20:00' },
  { id: 'e4', ruleId: 'r1', ruleName: 'CPU 임계치 초과', instanceName: mockInstances[0].name, metric: 'CPU Usage (%)', value: 91.0, threshold: 85, severity: 'critical', status: 'resolved',   firedAt: '2026-03-14 12:10:33', resolvedAt: '2026-03-14 12:45:18' },
  { id: 'e5', ruleId: 'r2', ruleName: 'Memory 경고',     instanceName: mockInstances[1].name, metric: 'Memory Usage (%)', value: 81.2, threshold: 80, severity: 'warning', status: 'resolved',   firedAt: '2026-03-14 11:30:05', resolvedAt: '2026-03-14 11:42:09' },
  { id: 'e6', ruleId: 'r5', ruleName: 'IOPS 모니터링',   instanceName: mockInstances[3].name, metric: 'IOPS', value: 5240, threshold: 5000, severity: 'info', status: 'resolved', firedAt: '2026-03-14 10:05:21', resolvedAt: '2026-03-14 10:18:44' },
]

const METRICS = ['CPU Usage (%)', 'Memory Usage (%)', 'TPS', 'Active Sessions', 'IOPS', 'Connection Usage (%)']
const SEVERITY_STYLE: Record<Severity, { bg: string; color: string; label: string }> = {
  critical: { bg: '#fee2e2', color: '#dc2626', label: 'Critical' },
  warning:  { bg: '#fef3c7', color: '#d97706', label: 'Warning' },
  info:     { bg: '#eff6ff', color: '#1d4ed8', label: 'Info' },
}
const STATUS_STYLE: Record<AlertStatus, { bg: string; color: string; label: string }> = {
  firing:       { bg: '#fee2e2', color: '#dc2626', label: '발생 중' },
  resolved:     { bg: '#d1fae5', color: '#059669', label: '해소됨' },
  acknowledged: { bg: '#fef3c7', color: '#d97706', label: '확인됨' },
}

// ── 알림 규칙 편집 모달 ──────────────────────────
function RuleModal({
  rule, onSave, onClose,
}: {
  rule: Partial<AlertRule> | null
  onSave: (r: AlertRule) => void
  onClose: () => void
}) {
  const isNew = !rule?.id
  const [form, setForm] = useState<Partial<AlertRule>>(rule ?? {
    name: '', instanceId: mockInstances[0].id, metric: METRICS[0],
    condition: '>', threshold: 80, severity: 'warning', enabled: true,
    notifyEmail: true, notifySlack: false,
  })

  const set = (k: keyof AlertRule, v: any) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 10, width: 480, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,.18)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>{isNew ? '알림 규칙 추가' : '알림 규칙 편집'}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 규칙 이름 */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>규칙 이름</label>
            <input value={form.name ?? ''} onChange={e => set('name', e.target.value)}
              style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 10px', fontSize: 13, boxSizing: 'border-box' }} />
          </div>

          {/* 인스턴스 */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>인스턴스</label>
            <select value={form.instanceId} onChange={e => set('instanceId', e.target.value)}
              style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 10px', fontSize: 13, background: '#fff' }}>
              {mockInstances.slice(0, 8).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>

          {/* 메트릭 + 조건 + 임계값 */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>메트릭</label>
              <select value={form.metric} onChange={e => set('metric', e.target.value)}
                style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', fontSize: 12, background: '#fff' }}>
                {METRICS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>조건</label>
              <select value={form.condition} onChange={e => set('condition', e.target.value as any)}
                style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', fontSize: 12, background: '#fff' }}>
                {(['>', '<', '>=', '<='] as const).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>임계값</label>
              <input type="number" value={form.threshold ?? ''} onChange={e => set('threshold', Number(e.target.value))}
                style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', fontSize: 12, boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* 심각도 */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>심각도</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['critical', 'warning', 'info'] as Severity[]).map(s => {
                const st = SEVERITY_STYLE[s]
                const sel = form.severity === s
                return (
                  <button key={s} onClick={() => set('severity', s)} style={{
                    flex: 1, padding: '6px 0', fontSize: 12, borderRadius: 4, cursor: 'pointer',
                    border: `1px solid ${sel ? st.color : 'var(--border)'}`,
                    background: sel ? st.bg : '#fff', color: sel ? st.color : 'var(--text-secondary)',
                    fontWeight: sel ? 600 : 400,
                  }}>{st.label}</button>
                )
              })}
            </div>
          </div>

          {/* 알림 채널 */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>알림 채널</label>
            <div style={{ display: 'flex', gap: 16 }}>
              {([['notifyEmail', 'Email'], ['notifySlack', 'Slack']] as const).map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!form[key]} onChange={e => set(key, e.target.checked)} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <button onClick={onClose} style={{ padding: '7px 18px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer', background: '#fff' }}>취소</button>
          <button onClick={() => onSave({ ...form, id: form.id ?? `r${Date.now()}` } as AlertRule)}
            style={{ padding: '7px 18px', fontSize: 13, border: 'none', borderRadius: 5, cursor: 'pointer', background: '#1d4ed8', color: '#fff', fontWeight: 600 }}>
            {isNew ? '추가' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────
export default function AlertPage() {
  const [tab, setTab] = useState<'rules' | 'history'>('rules')
  const [rules, setRules] = useState<AlertRule[]>(INITIAL_RULES)
  const [events] = useState<AlertEvent[]>(MOCK_EVENTS)
  const [editTarget, setEditTarget] = useState<Partial<AlertRule> | null | false>(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [historyFilter, setHistoryFilter] = useState<Severity | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all')

  const toggleRule = (id: string) =>
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))

  const saveRule = (rule: AlertRule) => {
    setRules(prev => prev.some(r => r.id === rule.id) ? prev.map(r => r.id === rule.id ? rule : r) : [...prev, rule])
    setEditTarget(false)
  }

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id))
    setDeleteId(null)
  }

  const filteredEvents = events.filter(e =>
    (historyFilter === 'all' || e.severity === historyFilter) &&
    (statusFilter === 'all' || e.status === statusFilter)
  )

  const firingCount = events.filter(e => e.status === 'firing').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="알림" subtitle="알림 규칙 및 이력" />

      {/* 탭 + 액션 바 */}
      <div style={{
        background: '#fff', borderBottom: '1px solid var(--border)',
        padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 2, background: 'var(--grid-header-bg)', borderRadius: 6, padding: 3 }}>
          {([['rules', '알림 규칙'], ['history', '알림 이력']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '5px 16px', fontSize: 12, borderRadius: 4, border: 'none', cursor: 'pointer',
              background: tab === key ? '#fff' : 'transparent',
              color: tab === key ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: tab === key ? 600 : 400,
              boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
            }}>{label}{key === 'history' && firingCount > 0 && (
              <span style={{ marginLeft: 6, background: '#dc2626', color: '#fff', borderRadius: 9, fontSize: 10, padding: '1px 5px', fontWeight: 700 }}>{firingCount}</span>
            )}</button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {tab === 'rules' && (
          <button onClick={() => setEditTarget({})} style={{
            padding: '6px 16px', fontSize: 12, border: 'none', borderRadius: 5,
            background: '#1d4ed8', color: '#fff', cursor: 'pointer', fontWeight: 600,
          }}>+ 규칙 추가</button>
        )}
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>

        {/* ── 규칙 탭 ── */}
        {tab === 'rules' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 요약 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: '전체 규칙', value: rules.length, color: '#1d4ed8' },
                { label: '활성 규칙', value: rules.filter(r => r.enabled).length, color: '#059669' },
                { label: '비활성 규칙', value: rules.filter(r => !r.enabled).length, color: '#9ca3af' },
                { label: '현재 발생 중', value: firingCount, color: '#dc2626' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* 규칙 테이블 */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--grid-header-bg)' }}>
                    {['활성', '규칙 이름', '인스턴스', '메트릭', '조건', '심각도', '알림 채널', ''].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 500, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rules.map(rule => {
                    const inst = mockInstances.find(i => i.id === rule.instanceId)
                    const sv = SEVERITY_STYLE[rule.severity]
                    return (
                      <tr key={rule.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <button onClick={() => toggleRule(rule.id)} style={{
                            width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: rule.enabled ? '#1d4ed8' : '#d1d5db', position: 'relative', transition: 'background .2s',
                          }}>
                            <span style={{
                              position: 'absolute', top: 2, left: rule.enabled ? 18 : 2, width: 16, height: 16,
                              borderRadius: '50%', background: '#fff', transition: 'left .2s',
                            }} />
                          </button>
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{rule.name}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{inst?.name ?? rule.instanceId}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{rule.metric}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11 }}>
                          {rule.condition} {rule.threshold}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: sv.bg, color: sv.color, padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 11 }}>{sv.label}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {rule.notifyEmail && <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: 10, padding: '1px 6px', borderRadius: 3 }}>Email</span>}
                            {rule.notifySlack && <span style={{ background: '#f0fdf4', color: '#059669', fontSize: 10, padding: '1px 6px', borderRadius: 3 }}>Slack</span>}
                            {!rule.notifyEmail && !rule.notifySlack && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>없음</span>}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => setEditTarget(rule)} style={{ padding: '3px 10px', fontSize: 11, border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', background: '#fff' }}>편집</button>
                            <button onClick={() => setDeleteId(rule.id)} style={{ padding: '3px 10px', fontSize: 11, border: '1px solid #fee2e2', borderRadius: 4, cursor: 'pointer', background: '#fff', color: '#dc2626' }}>삭제</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 이력 탭 ── */}
        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 필터 */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>심각도</span>
                {(['all', 'critical', 'warning', 'info'] as const).map(v => (
                  <button key={v} onClick={() => setHistoryFilter(v)} style={{
                    padding: '3px 10px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
                    border: `1px solid ${historyFilter === v ? '#1d4ed8' : 'var(--border)'}`,
                    background: historyFilter === v ? '#eff6ff' : '#fff',
                    color: historyFilter === v ? '#1d4ed8' : 'var(--text-secondary)',
                    fontWeight: historyFilter === v ? 600 : 400,
                  }}>{v === 'all' ? '전체' : SEVERITY_STYLE[v].label}</button>
                ))}
              </div>
              <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>상태</span>
                {(['all', 'firing', 'acknowledged', 'resolved'] as const).map(v => (
                  <button key={v} onClick={() => setStatusFilter(v)} style={{
                    padding: '3px 10px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
                    border: `1px solid ${statusFilter === v ? '#1d4ed8' : 'var(--border)'}`,
                    background: statusFilter === v ? '#eff6ff' : '#fff',
                    color: statusFilter === v ? '#1d4ed8' : 'var(--text-secondary)',
                    fontWeight: statusFilter === v ? 600 : 400,
                  }}>{v === 'all' ? '전체' : STATUS_STYLE[v].label}</button>
                ))}
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                {filteredEvents.length}건
              </div>
            </div>

            {/* 이력 테이블 */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--grid-header-bg)' }}>
                    {['발생 시각', '규칙', '인스턴스', '메트릭', '값 / 임계값', '심각도', '상태', '해소 시각'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 500, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>해당 조건의 알림 이력이 없습니다</td></tr>
                  ) : filteredEvents.map(ev => {
                    const sv = SEVERITY_STYLE[ev.severity]
                    const st = STATUS_STYLE[ev.status]
                    return (
                      <tr key={ev.id} style={{ borderBottom: '1px solid var(--border-light)', background: ev.status === 'firing' ? '#fff5f5' : '#fff' }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11 }}>{ev.firedAt}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{ev.ruleName}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{ev.instanceName}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{ev.metric}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontWeight: 700, color: sv.color }}>{ev.value}</span>
                          <span style={{ color: 'var(--text-muted)' }}> / {ev.threshold}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: sv.bg, color: sv.color, padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 11 }}>{sv.label}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: st.bg, color: st.color, padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 11 }}>{st.label}</span>
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                          {ev.resolvedAt ?? '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 편집 모달 */}
      {editTarget !== false && (
        <RuleModal rule={editTarget} onSave={saveRule} onClose={() => setEditTarget(false)} />
      )}

      {/* 삭제 확인 모달 */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 10, width: 360, padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>규칙 삭제</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              이 알림 규칙을 삭제하면 복구할 수 없습니다. 계속하시겠습니까?
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '7px 18px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer', background: '#fff' }}>취소</button>
              <button onClick={() => deleteRule(deleteId)} style={{ padding: '7px 18px', fontSize: 13, border: 'none', borderRadius: 5, cursor: 'pointer', background: '#dc2626', color: '#fff', fontWeight: 600 }}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
