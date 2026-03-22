'use client'
import { useState, useRef, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import MetricChangeModal, {
  ALL_METRICS, genValue, genSeries, formatValue,
  ChartOptions, DEFAULT_CHART_OPTIONS,
} from './MetricChangeModal'
import type { TimeSeriesPoint } from '@/types/db.types'

// ── 기본 슬롯 목록 ────────────────────────────────────────────────
const DEFAULT_SLOTS = [
  'active_backend', 'connection_ratio', 'blks_hit',
  'blks_read',      'locks_waiting',    'tps',
  'checkpoints_req','current_age',      'age_used_ratio',
  'temp_bytes',     'os_cpu',           'os_memory',
]

// ── 시간 범위 설정 ────────────────────────────────────────────────
export interface TimeRange { id: string; label: string; shortLabel: string; ms: number }

export const TIME_RANGES: TimeRange[] = [
  { id: '5m',  label: '지난 5분',    shortLabel: '5m',  ms: 5  * 60_000 },
  { id: '10m', label: '지난 10분',   shortLabel: '10m', ms: 10 * 60_000 },
  { id: '30m', label: '지난 30분',   shortLabel: '30m', ms: 30 * 60_000 },
  { id: '1h',  label: '지난 1시간',  shortLabel: '1h',  ms: 60 * 60_000 },
  { id: '3h',  label: '지난 3시간',  shortLabel: '3h',  ms: 3  * 3600_000 },
  { id: '6h',  label: '지난 6시간',  shortLabel: '6h',  ms: 6  * 3600_000 },
  { id: '12h', label: '지난 12시간', shortLabel: '12h', ms: 12 * 3600_000 },
  { id: '1d',  label: '지난 1일',    shortLabel: '1d',  ms: 24 * 3600_000 },
]

// ── 시간 범위 선택기 ──────────────────────────────────────────────
export function TimeRangePicker({
  selected, onSelect, paused, pausedAt, ranges,
}: {
  selected: TimeRange
  onSelect: (r: TimeRange) => void
  paused?: boolean
  pausedAt?: Date
  ranges?: TimeRange[]
}) {
  const activeRanges = ranges ?? TIME_RANGES
  const [open, setOpen]           = useState(false)
  const [recentIds, setRecentIds] = useState<string[]>(() => [activeRanges[0]?.id, activeRanges[activeRanges.length - 1]?.id].filter(Boolean) as string[])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (r: TimeRange) => {
    onSelect(r)
    setRecentIds(prev => [r.id, ...prev.filter(id => id !== r.id)].slice(0, 5))
    setOpen(false)
  }

  const removeRecent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setRecentIds(prev => prev.filter(x => x !== id))
  }

  const recentRanges = recentIds.map(id => activeRanges.find(r => r.id === id)!).filter(Boolean)

  const fmtRange = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const yy = String(d.getFullYear()).slice(2)
    return `${yy}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  const pausedEnd   = pausedAt ?? new Date()
  const pausedStart = new Date(pausedEnd.getTime() - selected.ms)

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '3px 10px', borderRadius: 4, cursor: 'pointer',
          border: '1px solid var(--border)',
          background: open ? 'rgba(0,109,255,.1)' : 'var(--card-bg)',
          color: 'var(--text-primary)', fontSize: 12,
        }}
      >
        <span style={{ color: '#006DFF', fontWeight: 600 }}>{selected.shortLabel}</span>
        {paused ? (
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            {fmtRange(pausedStart)} ~ {fmtRange(pausedEnd)}
          </span>
        ) : (
          <>
            <span style={{ color: '#00C073', fontWeight: 600 }}>Live</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              {new Date().toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </>
        )}
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4,
          width: 300, background: 'var(--card-bg)',
          border: '1px solid var(--border)', borderRadius: 6,
          boxShadow: '0 4px 20px rgba(0,0,0,.5)',
          zIndex: 300, overflow: 'hidden',
        }}>
          {recentRanges.length > 0 && (
            <div>
              <div style={{ padding: '8px 12px 4px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>최근 검색</div>
              {recentRanges.map(r => (
                <div key={r.id}
                  onClick={() => handleSelect(r)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 14px', cursor: 'pointer', fontSize: 12,
                    color: r.id === selected.id ? '#006DFF' : 'var(--text-primary)',
                    background: r.id === selected.id ? 'rgba(0,109,255,.08)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (r.id !== selected.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.04)' }}
                  onMouseLeave={e => { if (r.id !== selected.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <span>{r.label}</span>
                  <button
                    onClick={e => removeRecent(e, r.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, padding: '0 2px', lineHeight: 1 }}
                  >×</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

          <div>
            <div style={{ padding: '8px 12px 6px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>빠른 시간 조회</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, padding: '0 12px 10px' }}>
              {activeRanges.map(r => (
                <button key={r.id}
                  onClick={() => handleSelect(r)}
                  style={{
                    padding: '7px 10px', fontSize: 12, textAlign: 'left',
                    border: 'none', borderRadius: 4, cursor: 'pointer',
                    background: r.id === selected.id ? 'rgba(0,109,255,.15)' : 'transparent',
                    color: r.id === selected.id ? '#006DFF' : 'var(--text-primary)',
                    fontWeight: r.id === selected.id ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (r.id !== selected.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.04)' }}
                  onMouseLeave={e => { if (r.id !== selected.id) (e.currentTarget as HTMLElement).style.background = r.id === selected.id ? 'rgba(0,109,255,.15)' : 'transparent' }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', padding: '8px 12px' }}>
            <button style={{
              width: '100%', padding: '8px', fontSize: 12, cursor: 'pointer',
              border: '1px solid var(--border)', borderRadius: 4,
              background: 'transparent', color: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <span>📅</span> 기간 상세 선택
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 개별 차트 ────────────────────────────────────────────────────
function MetricLineChart({
  metricId, rangeMs, paused, onChangeMetric,
}: {
  metricId: string
  rangeMs: number
  paused: boolean
  onChangeMetric: (id: string) => void
}) {
  const meta = ALL_METRICS.find(m => m.id === metricId)!
  const [data, setData]           = useState<TimeSeriesPoint[]>(() => genSeries(meta, rangeMs))
  const [modalOpen, setModalOpen] = useState(false)
  const [chartOpts, setChartOpts] = useState<ChartOptions>(DEFAULT_CHART_OPTIONS)

  // 5초마다 새 포인트 추가
  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => {
      setData(prev => [...prev.slice(-59), { timestamp: Date.now(), value: genValue(meta) }])
    }, 5_000)
    return () => clearInterval(timer)
  }, [meta, paused])

  // 범위 또는 지표 변경 시 재생성
  useEffect(() => {
    setData(genSeries(meta, rangeMs))
  }, [metricId, rangeMs])

  // 차트 옵션에 따른 표시 데이터
  const displayData = chartOpts.displayMode === 'bar' ? data.slice(-chartOpts.barCount) : data

  const series: object = chartOpts.displayMode === 'line'
    ? {
        type: 'line',
        data: displayData.map(d => [d.timestamp, d.value]),
        smooth: false,
        symbol: chartOpts.pointMode ? 'circle' : 'none',
        symbolSize: 4,
        showSymbol: chartOpts.pointMode,
        lineStyle: { color: '#00C073', width: 1.5 },
        areaStyle: chartOpts.fillMode
          ? { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#00C07328' }, { offset: 1, color: '#00C07300' }] } }
          : undefined,
        ...(chartOpts.stackMode ? { stack: 'total' } : {}),
      }
    : {
        type: 'bar',
        data: displayData.map(d => [d.timestamp, d.value]),
        itemStyle: { color: '#00C073', borderRadius: [2, 2, 0, 0] },
        barMaxWidth: 12,
        ...(chartOpts.stackMode ? { stack: 'total' } : {}),
      }

  const option = {
    legend: chartOpts.showLegend
      ? { show: true, top: 2, textStyle: { color: '#8899AA', fontSize: 10 } }
      : { show: false },
    grid: { top: chartOpts.showLegend ? 28 : 20, bottom: 22, left: 44, right: 8 },
    xAxis: {
      type: 'time',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: {
        fontSize: 9, color: '#8899AA',
        formatter: (val: number) => {
          const d = new Date(val)
          return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitNumber: 4,
      splitLine: { lineStyle: { color: '#1E3050', type: 'dashed' } },
      axisLabel: { fontSize: 9, color: '#8899AA' },
    },
    series: [series],
    tooltip: {
      trigger: 'axis',
      order: chartOpts.tooltipSorting ? ('valueDesc' as const) : undefined,
      axisPointer: { type: 'line', lineStyle: { color: '#006DFF', width: 1, type: 'dashed' } },
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      padding: [6, 10],
      textStyle: { color: '#111', fontSize: 11 },
      formatter: (params: any) => {
        const p       = params[0]
        const t       = new Date(p.value[0]).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const val     = Number(p.value[1])
        const display = formatValue(val, meta)
        return `<span style="color:#888;font-size:10px">${t}</span><br/><span style="color:#333;font-size:12px">${meta.label} </span><b style="color:#00C073;font-size:13px">${display}</b><span style="color:#888;font-size:11px"> ${meta.unit}</span>`
      },
    },
    backgroundColor: 'transparent',
  }

  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{meta.label}</span>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setModalOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, padding: '0 2px', letterSpacing: 2, lineHeight: 1 }}
            title="지표 변경">•••</button>
          {modalOpen && (
            <MetricChangeModal
              currentId={metricId}
              currentOptions={chartOpts}
              rangeMs={rangeMs}
              onSave={(id, opts) => { onChangeMetric(id); setChartOpts(opts) }}
              onClose={() => setModalOpen(false)}
            />
          )}
        </div>
      </div>
      <ReactECharts option={option} style={{ height: 120, width: '100%' }} notMerge />
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────
interface DbOverviewProps {
  metric?: unknown; sessionDist?: unknown; cpuSeries?: unknown
  memSeries?: unknown; tpsSeries?: unknown; sessionSeries?: unknown
}

export default function DbOverview(_props: DbOverviewProps) {
  const [slots, setSlots]         = useState<string[]>(DEFAULT_SLOTS)
  const [expanded, setExpanded]   = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>(TIME_RANGES[0])
  const [paused, setPaused]       = useState(false)
  const [pausedAt, setPausedAt]   = useState<Date | undefined>(undefined)

  const cols    = expanded ? 3 : 2
  const visible = expanded ? slots : slots.slice(0, 10)

  const changeMetric = (idx: number, newId: string) =>
    setSlots(prev => prev.map((id, i) => i === idx ? newId : id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>인스턴스 지표</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', cursor: 'help' }} title="DB 및 OS 실시간 지표">?</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* AI 이상 탐지 */}
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>AI 이상 탐지</span>
          <div style={{ width: 32, height: 16, borderRadius: 8, background: '#2A3D55', cursor: 'pointer', position: 'relative' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#4B5563', position: 'absolute', top: 2, left: 2 }} />
          </div>

          {/* 시간 범위 선택기 */}
          <TimeRangePicker selected={timeRange} onSelect={setTimeRange} paused={paused} pausedAt={pausedAt} />

          {/* 이전/일시정지/다음 */}
          <div style={{ display: 'flex', gap: 2 }}>
            <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 3, padding: '2px 6px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11 }}>◀◀</button>
            <button
              onClick={() => { setPaused(p => { if (!p) setPausedAt(new Date()); return !p }) }}
              style={{
                border: '1px solid var(--border)', borderRadius: 3,
                padding: '2px 8px', cursor: 'pointer', fontSize: 11,
                background: paused ? 'rgba(0,109,255,.15)' : 'none',
                color: paused ? '#006DFF' : 'var(--text-muted)',
              }}
              title={paused ? '재개' : '일시정지'}
            >
              {paused ? '▶' : '⏸'}
            </button>
            <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 3, padding: '2px 6px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11 }}>▶▶</button>
          </div>
        </div>
      </div>

      {/* 차트 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
        {visible.map((id, idx) => (
          <MetricLineChart
            key={`${idx}-${id}`}
            metricId={id}
            rangeMs={timeRange.ms}
            paused={paused}
            onChangeMetric={(newId) => changeMetric(idx, newId)}
          />
        ))}
      </div>
    </div>
  )
}
