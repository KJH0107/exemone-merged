'use client'
import { useState, useCallback } from 'react'
import GridLayout, { Layout } from 'react-grid-layout'
import Header from '@/components/layout/Header'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

// ─────────────────────────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────────────────────────
interface Dashboard {
  id: string
  name: string
  description: string
  tags: string[]
  createdAt: string
  updatedAt: string
  widgetCount: number
  owner: string
}

type WidgetType =
  | 'metric-card'
  | 'line-chart'
  | 'donut-chart'
  | 'bar-chart'
  | 'session-bar'
  | 'scatter-chart'
  | 'top-sql'
  | 'alert-list'
  | 'status-summary'
  | 'table'

interface WidgetInstance {
  id: string
  type: WidgetType
  title: string
  // TODO: 실제 API 연동 시 metric, instance, timeRange 등 설정값 추가 필요
}

// ─────────────────────────────────────────────────────────────────
// 위젯 팔레트 정의
// ─────────────────────────────────────────────────────────────────
const WIDGET_PALETTE: { type: WidgetType; label: string; icon: string; desc: string; defaultW: number; defaultH: number }[] = [
  { type: 'metric-card',    label: '메트릭 카드',     icon: '🔢', desc: '단일 수치 표시 (CPU, TPS 등)',          defaultW: 3, defaultH: 2 },
  { type: 'line-chart',     label: '라인 차트',       icon: '📈', desc: '시계열 트렌드 차트',                    defaultW: 6, defaultH: 4 },
  { type: 'donut-chart',    label: '도넛/게이지',      icon: '🍩', desc: '사용률 도넛 또는 게이지 차트',          defaultW: 3, defaultH: 3 },
  { type: 'bar-chart',      label: '바 차트',         icon: '📊', desc: '카테고리별 비교 바 차트',               defaultW: 6, defaultH: 4 },
  { type: 'session-bar',    label: '세션 분포',        icon: '🟦', desc: 'Active/Idle/Lock/Long 세션 분포 바',   defaultW: 6, defaultH: 2 },
  { type: 'scatter-chart',  label: 'Scatter 차트',    icon: '⚡', desc: 'Transaction Response Time Scatter',     defaultW: 6, defaultH: 4 },
  { type: 'top-sql',        label: 'Top SQL',         icon: '🗂', desc: '실행 횟수/대기 시간 상위 SQL 목록',     defaultW: 8, defaultH: 4 },
  { type: 'alert-list',     label: '알림 목록',        icon: '🔔', desc: '최근 알림 이벤트 목록',                defaultW: 4, defaultH: 4 },
  { type: 'status-summary', label: '상태 요약',        icon: '🟢', desc: 'DB 인스턴스 상태별 요약 카드',         defaultW: 8, defaultH: 2 },
  { type: 'table',          label: '데이터 테이블',    icon: '📋', desc: '범용 데이터 그리드 테이블',             defaultW: 8, defaultH: 4 },
]

// ─────────────────────────────────────────────────────────────────
// Mock 대시보드 목록
// ─────────────────────────────────────────────────────────────────
const INITIAL_DASHBOARDS: Dashboard[] = [
  { id: 'd1', name: 'DB 성능 대시보드',    description: 'Oracle/PostgreSQL 핵심 성능 지표 통합 뷰', tags: ['oracle','postgresql','성능'], createdAt: '2026-01-10', updatedAt: '2026-03-13', widgetCount: 8,  owner: 'admin' },
  { id: 'd2', name: '인프라 모니터링',      description: '전체 인프라 리소스 사용률 및 가용성 모니터링', tags: ['인프라','cpu','memory'],     createdAt: '2026-01-15', updatedAt: '2026-03-12', widgetCount: 12, owner: 'ops' },
  { id: 'd3', name: 'Oracle 전용 뷰',      description: 'Oracle DB 전용 세션/SQL/Tablespace 분석', tags: ['oracle','dba'],              createdAt: '2026-02-01', updatedAt: '2026-03-10', widgetCount: 6,  owner: 'dba_team' },
  { id: 'd4', name: '주간 리포트',          description: '주간 DB 성능 트렌드 및 이상 이벤트 요약',   tags: ['리포트','트렌드'],           createdAt: '2026-02-08', updatedAt: '2026-03-08', widgetCount: 5,  owner: 'admin' },
  { id: 'd5', name: 'DBA 운영 현황',        description: 'DBA 일상 운영 체크리스트 및 현황판',        tags: ['dba','운영'],                createdAt: '2026-02-14', updatedAt: '2026-03-06', widgetCount: 9,  owner: 'dba_team' },
  { id: 'd6', name: 'SQL 분석 보드',        description: 'Top SQL / Slow Query 집중 분석',           tags: ['sql','slow-query','성능'],  createdAt: '2026-02-20', updatedAt: '2026-03-05', widgetCount: 7,  owner: 'dba_team' },
]

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  oracle:       { bg: '#fee2e2', color: '#b91c1c' },
  postgresql:   { bg: '#eff6ff', color: '#1d4ed8' },
  mysql:        { bg: '#f0fdf4', color: '#15803d' },
  성능:         { bg: '#fef3c7', color: '#b45309' },
  sql:          { bg: '#f5f3ff', color: '#6d28d9' },
  dba:          { bg: '#fdf4ff', color: '#7e22ce' },
  인프라:       { bg: '#ecfeff', color: '#0e7490' },
  리포트:       { bg: '#f0f9ff', color: '#0369a1' },
  운영:         { bg: '#f8fafc', color: '#475569' },
  cpu:          { bg: '#fff7ed', color: '#c2410c' },
  memory:       { bg: '#fdf4ff', color: '#7e22ce' },
  'slow-query': { bg: '#fee2e2', color: '#b91c1c' },
  트렌드:       { bg: '#f0f9ff', color: '#0369a1' },
}

// ─────────────────────────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>(INITIAL_DASHBOARDS)
  const [search, setSearch]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName]       = useState('')
  const [newDesc, setNewDesc]       = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [builderTarget, setBuilderTarget] = useState<Dashboard | null>(null)

  const filtered = dashboards.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.description.toLowerCase().includes(search.toLowerCase()) ||
    d.tags.some(t => t.includes(search.toLowerCase()))
  )

  const handleCreate = () => {
    if (!newName.trim()) return
    const nd: Dashboard = {
      id: `d${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || '새 대시보드',
      tags: [],
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      widgetCount: 0,
      owner: 'admin',
    }
    setDashboards(prev => [nd, ...prev])
    setNewName(''); setNewDesc(''); setShowCreate(false)
    setBuilderTarget(nd)   // 생성 직후 바로 빌더 열기
  }

  const handleDelete = (id: string) => {
    setDashboards(prev => prev.filter(d => d.id !== id))
    setDeleteTarget(null)
  }

  // 빌더 뷰
  if (builderTarget) {
    return (
      <DashboardBuilder
        dashboard={builderTarget}
        onClose={() => setBuilderTarget(null)}
        onSave={(widgetCount) => {
          setDashboards(prev => prev.map(d =>
            d.id === builderTarget.id
              ? { ...d, widgetCount, updatedAt: new Date().toISOString().slice(0, 10) }
              : d
          ))
          setBuilderTarget(null)
        }}
      />
    )
  }

  // 목록 뷰
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="대시보드" />

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="대시보드 검색 (이름, 태그)"
              style={{ width: '100%', padding: '8px 10px 8px 32px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, outline: 'none', background: '#fff' }} />
          </div>
          <button onClick={() => setShowCreate(true)} style={{
            padding: '8px 16px', background: '#1d4ed8', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600,
          }}>+ 대시보드 생성</button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>총 {filtered.length}개</span>
        </div>

        {/* 카드 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(d => (
            <div key={d.id} onClick={() => setBuilderTarget(d)}
              style={{
                background: '#fff', border: '1px solid var(--border)', borderRadius: 10,
                padding: 20, cursor: 'pointer', boxShadow: 'var(--card-shadow)',
                transition: 'box-shadow .15s', display: 'flex', flexDirection: 'column', gap: 10,
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.12)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--card-shadow)')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{d.description}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); setDeleteTarget(d.id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, padding: '0 4px', flexShrink: 0, lineHeight: 1 }}>×</button>
              </div>
              {d.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {d.tags.map(tag => {
                    const tc = TAG_COLORS[tag] ?? { bg: '#f1f5f9', color: '#475569' }
                    return <span key={tag} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: tc.bg, color: tc.color, fontWeight: 500 }}>{tag}</span>
                  })}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: 10 }}>
                <span>위젯 {d.widgetCount}개 · {d.owner}</span>
                <span>수정 {d.updatedAt}</span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text-muted)', fontSize: 14 }}>검색 결과가 없습니다.</div>
        )}
      </div>

      {/* 생성 모달 */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>새 대시보드 생성</div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>대시보드 이름 *</label>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="예: Oracle 성능 모니터링" autoFocus
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>설명</label>
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)}
              placeholder="대시보드 설명을 입력하세요" rows={3}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, outline: 'none', resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn onClick={() => setShowCreate(false)}>취소</Btn>
            <Btn primary onClick={handleCreate}>생성 후 편집</Btn>
          </div>
        </Modal>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)} width={360}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>대시보드 삭제</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            <b style={{ color: 'var(--text-primary)' }}>{dashboards.find(d => d.id === deleteTarget)?.name}</b>을 삭제하시겠습니까?
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn onClick={() => setDeleteTarget(null)}>취소</Btn>
            <Btn danger onClick={() => handleDelete(deleteTarget)}>삭제</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// 대시보드 빌더
// ─────────────────────────────────────────────────────────────────
function DashboardBuilder({
  dashboard,
  onClose,
  onSave,
}: {
  dashboard: Dashboard
  onClose: () => void
  onSave: (widgetCount: number) => void
}) {
  const [widgets, setWidgets]   = useState<WidgetInstance[]>([])
  const [layout, setLayout]     = useState<Layout[]>([])
  const [containerW, setContainerW] = useState(1000)
  const [selected, setSelected] = useState<string | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(true)
  const [saved, setSaved]       = useState(false)

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (node) setContainerW(node.offsetWidth - (paletteOpen ? 264 : 0) - 24)
  }, [paletteOpen])

  const addWidget = (palette: typeof WIDGET_PALETTE[0]) => {
    const id = `w-${Date.now()}`
    const newWidget: WidgetInstance = { id, type: palette.type, title: palette.label }
    const newLayout: Layout = {
      i: id, x: 0, y: Infinity,
      w: palette.defaultW, h: palette.defaultH,
      minW: 2, minH: 2,
    }
    setWidgets(prev => [...prev, newWidget])
    setLayout(prev => [...prev, newLayout])
    setSelected(id)
  }

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id))
    setLayout(prev => prev.filter(l => l.i !== id))
    if (selected === id) setSelected(null)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => {
      onSave(widgets.length)
    }, 600)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* 빌더 헤더 */}
      <div style={{
        height: 'var(--header-height)', background: '#1e293b', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', flexShrink: 0, gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>←</button>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{dashboard.name}</span>
            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 10 }}>위젯 {widgets.length}개</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setPaletteOpen(o => !o)} style={{
            padding: '5px 12px', border: '1px solid #334155', borderRadius: 5,
            background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer',
          }}>{paletteOpen ? '패널 닫기' : '위젯 추가'}</button>
          <button onClick={handleSave} style={{
            padding: '6px 18px', background: saved ? '#059669' : '#1d4ed8', color: '#fff',
            border: 'none', borderRadius: 5, fontSize: 13, cursor: 'pointer', fontWeight: 600,
            transition: 'background .3s',
          }}>{saved ? '✓ 저장됨' : '저장'}</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 위젯 팔레트 */}
        {paletteOpen && (
          <div style={{
            width: 252, flexShrink: 0, background: '#f8fafc',
            borderRight: '1px solid var(--border)', overflowY: 'auto',
          }}>
            <div style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', background: '#fff' }}>
              위젯 팔레트
            </div>

            {/* TODO: 실제 API 연동 시 아래 안내 제거 */}
            <div style={{
              margin: 10, padding: '8px 10px', background: '#fffbeb',
              border: '1px solid #fcd34d', borderRadius: 6, fontSize: 11, color: '#92400e', lineHeight: 1.5,
            }}>
              📌 <b>등록 가이드</b><br />
              현재 위젯은 Mock 데이터로 동작합니다.<br />
              실제 연동 시 각 위젯의 <code>instanceId</code>, <code>metric</code>, <code>timeRange</code> 설정이 필요합니다.
            </div>

            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {WIDGET_PALETTE.map(p => (
                <div key={p.type}
                  onClick={() => addWidget(p)}
                  style={{
                    padding: '10px 12px', background: '#fff', border: '1px solid var(--border)',
                    borderRadius: 7, cursor: 'pointer', transition: 'border-color .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#1d4ed8')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 16 }}>{p.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{p.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 24 }}>{p.desc}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', paddingLeft: 24, marginTop: 4 }}>기본 크기: {p.defaultW}×{p.defaultH}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 캔버스 영역 */}
        <div ref={ref} style={{ flex: 1, overflow: 'auto', background: '#e3e7ea', padding: 12 }}>
          {widgets.length === 0 ? (
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
              color: 'var(--text-muted)',
            }}>
              <div style={{ fontSize: 40 }}>🗂</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>위젯을 추가해 대시보드를 구성하세요</div>
              <div style={{ fontSize: 12 }}>왼쪽 팔레트에서 위젯을 클릭하면 캔버스에 추가됩니다</div>
            </div>
          ) : (
            <GridLayout
              layout={layout}
              cols={12}
              rowHeight={60}
              width={containerW}
              onLayoutChange={setLayout}
              draggableHandle=".w-handle"
              margin={[12, 12]}
            >
              {widgets.map(w => (
                <div key={w.id} onClick={() => setSelected(w.id)}>
                  <WidgetCard
                    widget={w}
                    selected={selected === w.id}
                    onRemove={() => removeWidget(w.id)}
                  />
                </div>
              ))}
            </GridLayout>
          )}
        </div>

        {/* 속성 패널 (선택된 위젯이 있을 때) */}
        {selected && (() => {
          const w = widgets.find(x => x.id === selected)
          if (!w) return null
          const palette = WIDGET_PALETTE.find(p => p.type === w.type)!
          return (
            <div style={{
              width: 240, flexShrink: 0, background: '#fff',
              borderLeft: '1px solid var(--border)', overflowY: 'auto',
            }}>
              <div style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                위젯 속성
              </div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>위젯 타입</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{palette.icon} {palette.label}</div>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>제목</label>
                  <input
                    value={w.title}
                    onChange={e => setWidgets(prev => prev.map(x => x.id === w.id ? { ...x, title: e.target.value } : x))}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, outline: 'none' }}
                  />
                </div>

                {/* TODO: 실제 API 연동 시 아래 항목들 구현 필요 */}
                <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>데이터 설정 <span style={{ color: '#f59e0b' }}>⚠ 미구현</span></div>
                  {[
                    { label: '인스턴스', placeholder: '예: postgresql-1', note: 'TODO: 인스턴스 목록 API 연동' },
                    { label: '메트릭',   placeholder: '예: cpu_usage',    note: 'TODO: 메트릭 목록 API 연동' },
                    { label: '시간 범위', placeholder: '예: 1h',          note: 'TODO: timeRange 선택기 연동' },
                  ].map(f => (
                    <div key={f.label} style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                        {f.label}
                      </label>
                      <input placeholder={f.placeholder} disabled
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, background: '#f1f5f9', color: 'var(--text-muted)' }} />
                      <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 2 }}>{f.note}</div>
                    </div>
                  ))}
                </div>

                <button onClick={() => removeWidget(selected)} style={{
                  padding: '7px', border: '1px solid #fca5a5', borderRadius: 5,
                  background: '#fef2f2', color: '#dc2626', fontSize: 12, cursor: 'pointer', fontWeight: 600,
                }}>위젯 삭제</button>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// 위젯 카드 (캔버스 내)
// ─────────────────────────────────────────────────────────────────
function WidgetCard({ widget, selected, onRemove }: { widget: WidgetInstance; selected: boolean; onRemove: () => void }) {
  const palette = WIDGET_PALETTE.find(p => p.type === widget.type)!
  return (
    <div style={{
      height: '100%', background: '#fff',
      border: `2px solid ${selected ? '#1d4ed8' : 'var(--border)'}`,
      borderRadius: 8, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', boxShadow: selected ? '0 0 0 3px #1d4ed822' : 'var(--card-shadow)',
    }}>
      {/* 헤더 (드래그 핸들) */}
      <div className="w-handle" style={{
        padding: '7px 12px', background: 'var(--grid-header-bg)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'grab', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>{palette.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{widget.title}</span>
        </div>
        <button onClick={e => { e.stopPropagation(); onRemove() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1, padding: '0 2px' }}>×</button>
      </div>

      {/* 위젯 프리뷰 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, overflow: 'hidden' }}>
        <WidgetPreview type={widget.type} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// 위젯 프리뷰 (Mock 시각화)
// TODO: 실제 API 연동 시 각 위젯별 실제 데이터로 교체 필요
// ─────────────────────────────────────────────────────────────────
function WidgetPreview({ type }: { type: WidgetType }) {
  const MOCK_LINE = Array.from({ length: 20 }, (_, i) => 30 + Math.sin(i * 0.5) * 20 + Math.random() * 10)
  const maxVal = Math.max(...MOCK_LINE)

  switch (type) {
    case 'metric-card':
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>CPU Usage</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#1d4ed8' }}>47<span style={{ fontSize: 16 }}>%</span></div>
          {/* TODO: instanceId, metric 연동 */}
        </div>
      )

    case 'line-chart':
      return (
        <svg width="100%" height="80" viewBox={`0 0 ${MOCK_LINE.length * 10} 80`} preserveAspectRatio="none">
          <polyline
            points={MOCK_LINE.map((v, i) => `${i * 10},${80 - (v / maxVal) * 70}`).join(' ')}
            fill="none" stroke="#006DFF" strokeWidth="2"
          />
          <polyline
            points={`0,80 ${MOCK_LINE.map((v, i) => `${i * 10},${80 - (v / maxVal) * 70}`).join(' ')} ${(MOCK_LINE.length - 1) * 10},80`}
            fill="#006DFF22" stroke="none"
          />
          {/* TODO: ECharts LineChart 컴포넌트로 교체 */}
        </svg>
      )

    case 'donut-chart':
      const pct = 65
      const r = 30, cx = 50, cy = 45
      const circ = 2 * Math.PI * r
      return (
        <svg width="100" height="90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e3e7ea" strokeWidth="10" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#006DFF" strokeWidth="10"
            strokeDasharray={`${circ * pct / 100} ${circ}`} strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`} />
          <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1d4ed8">{pct}%</text>
          {/* TODO: instanceId, metric 연동 */}
        </svg>
      )

    case 'bar-chart':
      const bars = [60, 40, 75, 30, 55, 80]
      return (
        <svg width="100%" height="80" viewBox="0 0 120 80" preserveAspectRatio="none">
          {bars.map((v, i) => (
            <rect key={i} x={i * 20 + 4} y={80 - v * 0.7} width="14" height={v * 0.7} fill="#006DFF" rx="2" opacity="0.8" />
          ))}
          {/* TODO: ECharts BarChart 컴포넌트로 교체 */}
        </svg>
      )

    case 'session-bar':
      const segs = [{ v: 23, c: '#006DFF' }, { v: 118, c: '#9BD9FF' }, { v: 2, c: '#FF1F3F' }, { v: 5, c: '#F9CB3B' }]
      const total = segs.reduce((s, x) => s + x.v, 0)
      return (
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden' }}>
            {segs.map((s, i) => <div key={i} style={{ width: `${s.v / total * 100}%`, background: s.c }} />)}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 10, color: 'var(--text-muted)' }}>
            {['Active','Idle','Lock','Long'].map((l, i) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: 1, background: segs[i].c }} />{l}
              </span>
            ))}
          </div>
        </div>
      )

    case 'scatter-chart':
      const dots = Array.from({ length: 30 }, () => ({ x: Math.random() * 100, y: Math.random() * 80, big: Math.random() < 0.1 }))
      return (
        <svg width="100%" height="80" viewBox="0 0 100 80">
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.big ? 4 : 2} fill={d.big ? '#ef4444' : '#006DFF'} opacity="0.7" />
          ))}
          {/* TODO: ECharts Scatter 컴포넌트로 교체 */}
        </svg>
      )

    case 'top-sql':
      return (
        <div style={{ width: '100%', fontSize: 10 }}>
          {[['SELECT * FROM orders...', '4,821', '12s'], ['UPDATE inventory...', '2,341', '8s'], ['SELECT u.* FROM users...', '1,892', '6s']].map(([sql, cnt, wait], i) => (
            <div key={i} style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border-light)', padding: '3px 0', color: 'var(--text-secondary)' }}>
              <span style={{ color: '#1d4ed8', fontWeight: 700, width: 12, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sql}</span>
              <span style={{ color: '#d97706', flexShrink: 0 }}>{wait}</span>
            </div>
          ))}
          {/* TODO: mockTopSql 데이터 연동 */}
        </div>
      )

    case 'alert-list':
      const alerts = [{ s: 'critical', msg: 'CPU 94% 초과' }, { s: 'warning', msg: '세션 급증' }, { s: 'warning', msg: 'Memory 임계 근접' }]
      return (
        <div style={{ width: '100%', fontSize: 11 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: a.s === 'critical' ? '#dc2626' : '#d97706', fontWeight: 700 }}>●</span>
              <span style={{ color: 'var(--text-secondary)' }}>{a.msg}</span>
            </div>
          ))}
          {/* TODO: 알림 시스템 API 연동 */}
        </div>
      )

    case 'status-summary':
      return (
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          {[['전체', 40, '#1d4ed8'], ['활성', 28, '#059669'], ['경고', 0, '#d97706'], ['장애', 12, '#dc2626']].map(([l, v, c]) => (
            <div key={l as string} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: c as string }}>{v}</div>
            </div>
          ))}
          {/* TODO: mockInstances summarize 연동 */}
        </div>
      )

    case 'table':
      return (
        <div style={{ width: '100%', fontSize: 10 }}>
          <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', paddingBottom: 3, marginBottom: 4, color: 'var(--text-muted)', fontWeight: 600 }}>
            <span style={{ flex: 1 }}>인스턴스</span><span style={{ width: 40 }}>CPU</span><span style={{ width: 40 }}>MEM</span>
          </div>
          {[['postgresql-1','37.9%','69.4%'],['mysql-1','18.5%','52.3%'],['oracle-1','22.8%','58.4%']].map(([n, c, m]) => (
            <div key={n} style={{ display: 'flex', gap: 6, padding: '2px 0', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n}</span>
              <span style={{ width: 40 }}>{c}</span><span style={{ width: 40 }}>{m}</span>
            </div>
          ))}
          {/* TODO: 범용 데이터 그리드 API 연동 */}
        </div>
      )

    default: return null
  }
}

// ─────────────────────────────────────────────────────────────────
// 공통 컴포넌트
// ─────────────────────────────────────────────────────────────────
function Modal({ children, onClose, width = 440 }: { children: React.ReactNode; onClose: () => void; width?: number }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: '#fff', borderRadius: 12, padding: 28, zIndex: 201, width,
        boxShadow: '0 8px 32px rgba(0,0,0,.2)',
      }}>{children}</div>
    </>
  )
}

function Btn({ children, onClick, primary, danger }: { children: React.ReactNode; onClick: () => void; primary?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 18px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: primary || danger ? 600 : 400,
      border: danger ? 'none' : primary ? 'none' : '1px solid var(--border)',
      background: danger ? '#dc2626' : primary ? '#1d4ed8' : '#fff',
      color: danger || primary ? '#fff' : 'var(--text-primary)',
    }}>{children}</button>
  )
}
