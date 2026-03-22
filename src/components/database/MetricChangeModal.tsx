'use client'
import { useState } from 'react'
import ReactECharts from 'echarts-for-react'
import type { TimeSeriesPoint } from '@/types/db.types'

// ── 지표 목록 ─────────────────────────────────────────────────────
export type MetricMeta = {
  id: string; label: string; category: string; unit: string
  type: 'int' | 'float' | 'ratio'; base: number; variance: number; min: number
}

export const ALL_METRICS: MetricMeta[] = [
  { id: 'active_backend',   label: 'Active Backend',   category: 'DB', unit: 'count',     type: 'int',   base: 8,      variance: 0.4,  min: 1 },
  { id: 'connection_ratio', label: 'Connection Ratio',  category: 'DB', unit: 'ratio',     type: 'ratio', base: 0.42,   variance: 0.3,  min: 0.01 },
  { id: 'blks_hit',         label: 'Blks Hit',          category: 'DB', unit: 'count/sec', type: 'int',   base: 24800,  variance: 0.2,  min: 0 },
  { id: 'blks_read',        label: 'Blks Read',         category: 'DB', unit: 'count/sec', type: 'int',   base: 38,     variance: 0.5,  min: 0 },
  { id: 'locks_waiting',    label: 'Locks Waiting',     category: 'DB', unit: 'count',     type: 'int',   base: 1,      variance: 1.0,  min: 0 },
  { id: 'tps',              label: 'Tps',               category: 'DB', unit: 'count/sec', type: 'int',   base: 142,    variance: 0.3,  min: 0 },
  { id: 'checkpoints_req',  label: 'Checkpoints Req',   category: 'DB', unit: 'count',     type: 'int',   base: 1,      variance: 1.0,  min: 0 },
  { id: 'current_age',      label: 'Current Age',       category: 'DB', unit: 'age',       type: 'int',   base: 48684,  variance: 0.05, min: 0 },
  { id: 'age_used_ratio',   label: 'Age Used Ratio',    category: 'DB', unit: '%',         type: 'float', base: 2.26,   variance: 0.1,  min: 0 },
  { id: 'temp_bytes',       label: 'Temp Bytes',        category: 'DB', unit: 'bytes',     type: 'int',   base: 0,      variance: 1.0,  min: 0 },
  { id: 'deadlocks',        label: 'Deadlocks',         category: 'DB', unit: 'count',     type: 'int',   base: 0,      variance: 1.0,  min: 0 },
  { id: 'rollbacks',        label: 'Rollbacks',         category: 'DB', unit: 'count/sec', type: 'int',   base: 3,      variance: 0.6,  min: 0 },
  { id: 'commits',          label: 'Commits',           category: 'DB', unit: 'count/sec', type: 'int',   base: 138,    variance: 0.3,  min: 0 },
  { id: 'cache_hit_ratio',  label: 'Cache Hit Ratio',   category: 'DB', unit: '%',         type: 'float', base: 99.2,   variance: 0.01, min: 0 },
  { id: 'xact_total',       label: 'Xact Total',        category: 'DB', unit: 'count/sec', type: 'int',   base: 145,    variance: 0.3,  min: 0 },
  { id: 'tuple_fetched',    label: 'Tuple Fetched',     category: 'DB', unit: 'count/sec', type: 'int',   base: 18420,  variance: 0.2,  min: 0 },
  { id: 'os_cpu',           label: '(OS) Cpu Usage',    category: 'OS', unit: '%',         type: 'float', base: 34.5,   variance: 0.3,  min: 0 },
  { id: 'os_memory',        label: '(OS) Memory Used',  category: 'OS', unit: 'GB',        type: 'float', base: 18.2,   variance: 0.05, min: 0 },
  { id: 'os_disk_read',     label: '(OS) Disk Read',    category: 'OS', unit: 'KB/s',      type: 'int',   base: 320,    variance: 0.5,  min: 0 },
  { id: 'os_disk_write',    label: '(OS) Disk Write',   category: 'OS', unit: 'KB/s',      type: 'int',   base: 180,    variance: 0.5,  min: 0 },
  { id: 'os_net_in',        label: '(OS) Net In',       category: 'OS', unit: 'KB/s',      type: 'int',   base: 2840,   variance: 0.3,  min: 0 },
  { id: 'os_net_out',       label: '(OS) Net Out',      category: 'OS', unit: 'KB/s',      type: 'int',   base: 1120,   variance: 0.3,  min: 0 },
  { id: 'os_load_avg',      label: '(OS) Load Avg',     category: 'OS', unit: 'load',      type: 'float', base: 1.82,   variance: 0.2,  min: 0 },
  { id: 'os_iowait',        label: '(OS) I/O Wait',     category: 'OS', unit: '%',         type: 'float', base: 4.3,    variance: 0.4,  min: 0 },
]

export const METRIC_GROUPS = [
  {
    name: '지표 그룹',
    items: [
      { name: 'Logical + Physical IO', ids: ['blks_hit', 'blks_read'] },
      { name: 'Session & Lock',        ids: ['active_backend', 'locks_waiting', 'deadlocks'] },
      { name: 'Transaction Rate',      ids: ['tps', 'commits', 'rollbacks', 'xact_total'] },
    ],
  },
  {
    name: 'DB',
    items: ALL_METRICS.filter(m => m.category === 'DB').map(m => ({ name: m.label, ids: [m.id] })),
  },
  {
    name: 'OS',
    items: ALL_METRICS.filter(m => m.category === 'OS').map(m => ({ name: m.label, ids: [m.id] })),
  },
]

// ── 차트 옵션 ─────────────────────────────────────────────────────
export interface ChartOptions {
  displayMode: 'line' | 'bar'
  showLegend: boolean
  tooltipSorting: boolean
  stackMode: boolean
  fillMode: boolean
  pointMode: boolean
  barCount: number
}

export const DEFAULT_CHART_OPTIONS: ChartOptions = {
  displayMode: 'line',
  showLegend: false,
  tooltipSorting: false,
  stackMode: false,
  fillMode: true,
  pointMode: false,
  barCount: 20,
}

// ── 유틸 함수 ─────────────────────────────────────────────────────
export function genValue(m: MetricMeta): number {
  const raw = m.base + (Math.random() - 0.5) * m.base * m.variance
  const clamped = Math.max(m.min, raw)
  if (m.type === 'int') return Math.round(clamped)
  if (m.type === 'ratio') return Math.min(1, Math.max(0, parseFloat(clamped.toFixed(3))))
  return parseFloat(clamped.toFixed(3))
}

export function genSeries(m: MetricMeta, rangeMs: number): TimeSeriesPoint[] {
  const now   = Date.now()
  const count = Math.min(60, Math.max(20, Math.floor(rangeMs / 5_000)))
  return Array.from({ length: count }, (_, i) => ({
    timestamp: now - rangeMs + (i / (count - 1)) * rangeMs,
    value: genValue(m),
  }))
}

export function formatValue(val: number, m: MetricMeta): string {
  if (m.type === 'int')   return String(Math.round(val))
  if (m.type === 'ratio') return val.toFixed(3)
  if (m.unit === '%')     return val.toFixed(1)
  if (m.unit === 'GB')    return val.toFixed(2)
  return val.toFixed(3)
}

// ── 내부 UI 컴포넌트 ─────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 36, height: 20, borderRadius: 10, cursor: 'pointer', flexShrink: 0,
        background: value ? '#006DFF' : '#d1d5db',
        position: 'relative', transition: 'background .15s',
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: value ? 18 : 2,
        transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </div>
  )
}

function OptionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px', borderBottom: '1px solid #f3f4f6',
    }}>
      <span style={{ fontSize: 13, color: '#444' }}>{label}</span>
      {children}
    </div>
  )
}

// ── 지표 변경 모달 ────────────────────────────────────────────────
export default function MetricChangeModal({
  currentId, currentOptions, rangeMs, onSave, onClose,
}: {
  currentId: string
  currentOptions: ChartOptions
  rangeMs: number
  onSave: (id: string, opts: ChartOptions) => void
  onClose: () => void
}) {
  const [activeTab, setActiveTab]   = useState<'metric' | 'chart'>('metric')
  const [search, setSearch]         = useState('')
  const [pending, setPending]       = useState(currentId)
  const [pendingOpts, setPendingOpts] = useState<ChartOptions>(currentOptions)
  const [collapsed, setCollapsed]   = useState<Record<string, boolean>>({})

  const pendingMeta = ALL_METRICS.find(m => m.id === pending)!
  const previewData = genSeries(pendingMeta, rangeMs)

  const toggleSection = (name: string) =>
    setCollapsed(p => ({ ...p, [name]: !p[name] }))

  const filteredIds = (ids: string[]) => {
    if (!search) return ids
    return ids.filter(id => {
      const m = ALL_METRICS.find(x => x.id === id)
      return m?.label.toLowerCase().includes(search.toLowerCase())
    })
  }

  // ── 미리보기 차트 옵션 ─────────────────────────────────────────
  const displayData = pendingOpts.displayMode === 'bar'
    ? previewData.slice(-pendingOpts.barCount)
    : previewData

  const previewSeries: object = pendingOpts.displayMode === 'line'
    ? {
        type: 'line', name: pendingMeta.label,
        data: displayData.map(d => [d.timestamp, d.value]),
        smooth: false,
        symbol: pendingOpts.pointMode ? 'circle' : 'none',
        symbolSize: 4,
        showSymbol: pendingOpts.pointMode,
        lineStyle: { color: '#6bb8ff', width: 1.5 },
        areaStyle: pendingOpts.fillMode
          ? { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#6bb8ff50' }, { offset: 1, color: '#6bb8ff00' }] } }
          : undefined,
        ...(pendingOpts.stackMode ? { stack: 'total' } : {}),
      }
    : {
        type: 'bar', name: pendingMeta.label,
        data: displayData.map(d => [d.timestamp, d.value]),
        itemStyle: { color: '#6bb8ff', borderRadius: [2, 2, 0, 0] },
        barMaxWidth: 14,
        ...(pendingOpts.stackMode ? { stack: 'total' } : {}),
      }

  const previewOption = {
    legend: pendingOpts.showLegend
      ? { show: true, top: 4, textStyle: { color: '#666', fontSize: 11 } }
      : { show: false },
    grid: { top: pendingOpts.showLegend ? 32 : 24, bottom: 28, left: 52, right: 16 },
    xAxis: {
      type: 'time',
      axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false },
      axisLabel: {
        fontSize: 10, color: '#666',
        formatter: (v: number) => new Date(v).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      },
    },
    yAxis: {
      type: 'value', axisLine: { show: false }, axisTick: { show: false },
      splitNumber: 4, splitLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { fontSize: 10, color: '#666' },
    },
    series: [previewSeries],
    tooltip: {
      trigger: 'axis',
      order: pendingOpts.tooltipSorting ? 'valueDesc' : undefined,
      backgroundColor: '#fff', borderColor: '#e5e7eb',
      textStyle: { color: '#333', fontSize: 11 },
    },
    backgroundColor: 'transparent',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* 백드롭 */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)' }} />

      {/* 모달 */}
      <div style={{
        position: 'relative', width: 860, height: 540, background: '#fff',
        borderRadius: 8, display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(0,0,0,.3)', overflow: 'hidden',
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>지표 변경</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#999', lineHeight: 1 }}>×</button>
        </div>

        {/* 바디 */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* 좌측 패널 */}
          <div style={{ width: 280, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

            {/* 탭 */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
              {(['metric', 'chart'] as const).map((tab, i) => {
                const label = tab === 'metric' ? '지표 옵션' : '차트 옵션'
                const active = activeTab === tab
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    flex: 1, padding: '10px 0', fontSize: 13, border: 'none', cursor: 'pointer',
                    background: active ? '#fff' : '#f9fafb',
                    color: active ? '#006DFF' : '#666',
                    borderBottom: active ? '2px solid #006DFF' : '2px solid transparent',
                    fontWeight: active ? 600 : 400,
                  }}>{label}</button>
                )
              })}
            </div>

            {/* ── 지표 옵션 탭 ── */}
            {activeTab === 'metric' && (
              <>
                {/* 검색 */}
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 6 }}>
                  <button style={{ fontSize: 11, padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 4, background: '#f9fafb', cursor: 'pointer', color: '#555', whiteSpace: 'nowrap' }}>
                    프리셋 그룹
                  </button>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 4, padding: '0 8px', gap: 4 }}>
                    <span style={{ color: '#aaa', fontSize: 12 }}>🔍</span>
                    <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="검색" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, color: '#333', background: 'transparent' }} />
                  </div>
                </div>

                {/* 목록 */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {METRIC_GROUPS.map(group => {
                    const open = !collapsed[group.name]
                    return (
                      <div key={group.name}>
                        <button onClick={() => toggleSection(group.name)}
                          style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#333', background: '#f9fafb', border: 'none', borderBottom: '1px solid #e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10 }}>{open ? '▼' : '▶'}</span> {group.name}
                        </button>
                        {open && group.items.map(item => {
                          const visibleIds = filteredIds(item.ids)
                          if (visibleIds.length === 0) return null
                          const firstId = item.ids[0]
                          const isSelected = item.ids.includes(pending)
                          return (
                            <button key={item.name} onClick={() => setPending(firstId)}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                width: '100%', textAlign: 'left', padding: '8px 20px', fontSize: 12,
                                border: 'none', borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
                                background: isSelected ? '#eff6ff' : '#fff',
                                color: isSelected ? '#006DFF' : '#333',
                                fontWeight: isSelected ? 600 : 400,
                              }}
                              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#f9fafb' }}
                              onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#fff' }}>
                              <span>{item.name}</span>
                              {item.ids.length > 1 && (
                                <span style={{ fontSize: 10, color: '#888', background: '#f3f4f6', padding: '1px 6px', borderRadius: 3 }}>
                                  {item.ids.length} Stats
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* ── 차트 옵션 탭 ── */}
            {activeTab === 'chart' && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: '12px 16px 6px', fontSize: 12, fontWeight: 700, color: '#111', letterSpacing: 0.5 }}>Display</div>

                <OptionRow label="Display Mode">
                  <select
                    value={pendingOpts.displayMode}
                    onChange={e => setPendingOpts(p => ({ ...p, displayMode: e.target.value as 'line' | 'bar' }))}
                    style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, color: '#333', background: '#fff', cursor: 'pointer', minWidth: 90 }}
                  >
                    <option value="line">Line</option>
                    <option value="bar">Bar</option>
                  </select>
                </OptionRow>

                {pendingOpts.displayMode === 'bar' && (
                  <OptionRow label="Bar Count">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={() => setPendingOpts(p => ({ ...p, barCount: Math.max(5, p.barCount - 5) }))}
                        style={{ width: 24, height: 24, border: '1px solid #d1d5db', borderRadius: 4, background: '#f9fafb', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>−</button>
                      <span style={{ minWidth: 28, textAlign: 'center', fontSize: 13, color: '#333', fontWeight: 600 }}>{pendingOpts.barCount}</span>
                      <button onClick={() => setPendingOpts(p => ({ ...p, barCount: Math.min(60, p.barCount + 5) }))}
                        style={{ width: 24, height: 24, border: '1px solid #d1d5db', borderRadius: 4, background: '#f9fafb', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>+</button>
                    </div>
                  </OptionRow>
                )}

                <OptionRow label="Show Legend">
                  <Toggle value={pendingOpts.showLegend} onChange={v => setPendingOpts(p => ({ ...p, showLegend: v }))} />
                </OptionRow>

                <OptionRow label="Tooltip Sorting">
                  <Toggle value={pendingOpts.tooltipSorting} onChange={v => setPendingOpts(p => ({ ...p, tooltipSorting: v }))} />
                </OptionRow>

                <OptionRow label="Stack Mode">
                  <Toggle value={pendingOpts.stackMode} onChange={v => setPendingOpts(p => ({ ...p, stackMode: v }))} />
                </OptionRow>

                <OptionRow label="Fill Mode">
                  <Toggle value={pendingOpts.fillMode} onChange={v => setPendingOpts(p => ({ ...p, fillMode: v }))} />
                </OptionRow>

                <OptionRow label="Point Mode">
                  <Toggle value={pendingOpts.pointMode} onChange={v => setPendingOpts(p => ({ ...p, pointMode: v }))} />
                </OptionRow>
              </div>
            )}

          </div>

          {/* 우측 패널 — 미리보기 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 12 }}>{pendingMeta.label}</div>
            <div style={{ flex: 1 }}>
              <ReactECharts option={previewOption} style={{ height: '100%', width: '100%' }} notMerge />
            </div>
          </div>

        </div>

        {/* 푸터 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid #e5e7eb' }}>
          <button onClick={onClose}
            style={{ padding: '7px 20px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 4, background: '#fff', cursor: 'pointer', color: '#555' }}>
            취소
          </button>
          <button onClick={() => { onSave(pending, pendingOpts); onClose() }}
            style={{ padding: '7px 20px', fontSize: 13, border: 'none', borderRadius: 4, background: '#006DFF', cursor: 'pointer', color: '#fff', fontWeight: 600 }}>
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
