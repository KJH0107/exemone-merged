'use client'
import { useState, useEffect, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import Header from '@/components/layout/Header'
import { mockInstances } from '@/lib/mock/instances'
import ExportButton from '@/components/common/ExportButton'

// ── 타임 범위 옵션 ────────────────────────────────
const TIME_RANGES = ['10분', '30분', '1시간', '3시간', '6시간', '24시간']

// ── 메트릭 옵션 ──────────────────────────────────
const METRICS = [
  { key: 'cpu',      label: 'CPU Usage (%)',      color: '#006DFF', base: 45, variance: 20 },
  { key: 'memory',   label: 'Memory Usage (%)',   color: '#9BD9FF', base: 60, variance: 10 },
  { key: 'tps',      label: 'TPS',                color: '#F9CB3B', base: 300, variance: 120 },
  { key: 'sessions', label: 'Active Sessions',    color: '#10b981', base: 20, variance: 15 },
  { key: 'iops',     label: 'IOPS',               color: '#8b5cf6', base: 800, variance: 300 },
]

// ── 시계열 데이터 생성 ────────────────────────────
function genTrendSeries(base: number, variance: number, points = 60): [number, number][] {
  const now = Date.now()
  let val = base
  return Array.from({ length: points }, (_, i): [number, number] => {
    val = Math.max(0, val + (Math.random() - 0.5) * variance)
    return [now - (points - i) * 10000, Math.round(val * 10) / 10]
  })
}

// ── Scatter 데이터 생성 ───────────────────────────
function genScatterData(count = 120): [number, number][] {
  return Array.from({ length: count }, (): [number, number] => {
    const responseTime = Math.random() < 0.05
      ? 2000 + Math.random() * 8000       // 5% outlier
      : 10 + Math.random() * 500
    const timestamp = Date.now() - Math.random() * 3600000
    return [timestamp, Math.round(responseTime)]
  })
}

const INSTANCE_OPTIONS = mockInstances.slice(0, 8).map(i => ({ id: i.id, name: i.name, dbType: i.dbType }))

export default function PerformanceDatabasePage() {
  const [selectedInstance, setSelectedInstance] = useState(INSTANCE_OPTIONS[0].id)
  const [timeRange, setTimeRange]   = useState('1시간')
  const [activeMetrics, setActiveMetrics] = useState<string[]>(['cpu', 'tps'])
  const [activeTab, setActiveTab]   = useState<'trend' | 'scatter' | 'anomaly' | 'compare'>('trend')

  // 트렌드 데이터 (메트릭별 시계열)
  const trendData = useMemo(() =>
    Object.fromEntries(METRICS.map(m => [m.key, genTrendSeries(m.base, m.variance)])),
    [selectedInstance, timeRange]
  )

  // Scatter 데이터
  const scatterData = useMemo(() => genScatterData(), [selectedInstance, timeRange])

  const toggleMetric = (key: string) => {
    setActiveMetrics(prev =>
      prev.includes(key) ? (prev.length > 1 ? prev.filter(k => k !== key) : prev) : [...prev, key]
    )
  }

  const inst = INSTANCE_OPTIONS.find(i => i.id === selectedInstance)!

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="성능분석" subtitle="데이터베이스" />

      {/* 컨트롤 바 */}
      <div style={{
        background: '#fff', borderBottom: '1px solid var(--border)',
        padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
      }}>
        {/* 인스턴스 선택 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>인스턴스</span>
          <select value={selectedInstance} onChange={e => setSelectedInstance(e.target.value)}
            style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '4px 10px', fontSize: 12, background: '#fff', minWidth: 160 }}>
            {INSTANCE_OPTIONS.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>

        {/* 시간 범위 */}
        <div style={{ display: 'flex', gap: 4 }}>
          {TIME_RANGES.map(r => (
            <button key={r} onClick={() => setTimeRange(r)} style={{
              padding: '4px 10px', fontSize: 12, borderRadius: 4,
              border: `1px solid ${r === timeRange ? '#1d4ed8' : 'var(--border)'}`,
              background: r === timeRange ? '#eff6ff' : '#fff',
              color: r === timeRange ? '#1d4ed8' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: r === timeRange ? 600 : 400,
            }}>{r}</button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <ExportButton
          filename={`perf-${inst.name}`}
          columns={[
            { key: 'tab',    label: '분석 유형' },
            { key: 'metric', label: '메트릭' },
            { key: 'range',  label: '시간 범위' },
          ]}
          rows={[{ tab: activeTab, metric: activeMetrics.join(','), range: timeRange }]}
        />

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--grid-header-bg)', borderRadius: 6, padding: 3 }}>
          {([['trend','트렌드 분석'], ['scatter','Scatter 분석'], ['anomaly','AI 이상탐지'], ['compare','메트릭 비교']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              padding: '5px 14px', fontSize: 12, borderRadius: 4, border: 'none', cursor: 'pointer',
              background: activeTab === key ? '#fff' : 'transparent',
              color: activeTab === key ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === key ? 600 : 400,
              boxShadow: activeTab === key ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {activeTab === 'trend' && (
          <TrendTab
            inst={inst} trendData={trendData}
            activeMetrics={activeMetrics} onToggleMetric={toggleMetric}
          />
        )}
        {activeTab === 'scatter' && <ScatterTab data={scatterData} inst={inst} />}
        {activeTab === 'anomaly' && <AnomalyTab inst={inst} />}
        {activeTab === 'compare' && <CompareTab />}
      </div>
    </div>
  )
}

// ── 트렌드 탭 ─────────────────────────────────────
function TrendTab({ inst, trendData, activeMetrics, onToggleMetric }: {
  inst: typeof INSTANCE_OPTIONS[0]
  trendData: Record<string, [number, number][]>
  activeMetrics: string[]
  onToggleMetric: (k: string) => void
}) {
  const selectedMetricObjs = METRICS.filter(m => activeMetrics.includes(m.key))

  const option = {
    backgroundColor: 'transparent',
    grid: { top: 40, bottom: 60, left: 60, right: 20 },
    legend: {
      data: selectedMetricObjs.map(m => m.label),
      top: 8, textStyle: { fontSize: 12, color: 'var(--text-secondary)' },
    },
    xAxis: {
      type: 'time',
      axisLabel: { fontSize: 11, color: '#80868f', formatter: (v: number) => new Date(v).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) },
      splitLine: { lineStyle: { color: '#e3e7ea' } },
    },
    yAxis: { type: 'value', axisLabel: { fontSize: 11, color: '#80868f' }, splitLine: { lineStyle: { color: '#e3e7ea' } } },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: 'var(--border)',
      textStyle: { fontSize: 12, color: '#282c32' },
      formatter: (params: any[]) => {
        const t = new Date(params[0].value[0]).toLocaleTimeString('ko-KR')
        return `<b>${t}</b><br/>` + params.map((p: any) => `${p.marker}${p.seriesName}: <b>${p.value[1]}</b>`).join('<br/>')
      },
    },
    series: selectedMetricObjs.map(m => ({
      name: m.label,
      type: 'line',
      data: trendData[m.key],
      smooth: true,
      symbol: 'none',
      lineStyle: { color: m.color, width: 2 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: m.color + '33' }, { offset: 1, color: m.color + '00' }] } },
    })),
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 메트릭 토글 */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>메트릭 선택</span>
        {METRICS.map(m => (
          <button key={m.key} onClick={() => onToggleMetric(m.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
            border: `1px solid ${activeMetrics.includes(m.key) ? m.color : 'var(--border)'}`,
            borderRadius: 4, background: activeMetrics.includes(m.key) ? m.color + '18' : '#fff',
            cursor: 'pointer', fontSize: 12,
            color: activeMetrics.includes(m.key) ? m.color : 'var(--text-secondary)',
            fontWeight: activeMetrics.includes(m.key) ? 600 : 400,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />
            {m.label}
          </button>
        ))}
      </div>

      {/* 차트 */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{inst.name} — 트렌드 분석</div>
        <ReactECharts option={option} style={{ height: 360 }} notMerge />
      </div>

      {/* 메트릭 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {METRICS.map(m => {
          const vals = trendData[m.key].map(d => d[1])
          const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10
          const max = Math.round(Math.max(...vals) * 10) / 10
          const min = Math.round(Math.min(...vals) * 10) / 10
          return (
            <div key={m.key} style={{
              background: '#fff', border: `1px solid ${activeMetrics.includes(m.key) ? m.color : 'var(--border)'}`,
              borderRadius: 8, padding: '12px 14px',
              boxShadow: activeMetrics.includes(m.key) ? `0 0 0 2px ${m.color}22` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{m.label}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, fontSize: 11 }}>
                <div style={{ textAlign: 'center' }}><div style={{ color: 'var(--text-muted)' }}>AVG</div><div style={{ fontWeight: 700, color: m.color }}>{avg}</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ color: 'var(--text-muted)' }}>MAX</div><div style={{ fontWeight: 700, color: '#dc2626' }}>{max}</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ color: 'var(--text-muted)' }}>MIN</div><div style={{ fontWeight: 700, color: '#059669' }}>{min}</div></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Scatter 탭 ────────────────────────────────────
function ScatterTab({ data, inst }: { data: [number, number][]; inst: typeof INSTANCE_OPTIONS[0] }) {
  const option = {
    backgroundColor: 'transparent',
    grid: { top: 40, bottom: 60, left: 70, right: 20 },
    xAxis: {
      type: 'time',
      name: '시간', nameLocation: 'middle', nameGap: 40,
      axisLabel: { fontSize: 11, color: '#80868f', formatter: (v: number) => new Date(v).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) },
      splitLine: { lineStyle: { color: '#e3e7ea' } },
    },
    yAxis: {
      type: 'value',
      name: 'Response Time (ms)', nameLocation: 'middle', nameGap: 50,
      axisLabel: { fontSize: 11, color: '#80868f' },
      splitLine: { lineStyle: { color: '#e3e7ea' } },
    },
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => `${new Date(p.value[0]).toLocaleTimeString('ko-KR')}<br/>Response: <b>${p.value[1]}ms</b>`,
      backgroundColor: '#fff', borderColor: 'var(--border)', textStyle: { fontSize: 12 },
    },
    series: [{
      type: 'scatter',
      data,
      symbolSize: (val: number[]) => val[1] > 1000 ? 10 : 5,
      itemStyle: {
        color: (p: any) => p.value[1] > 1000 ? '#ef4444' : p.value[1] > 300 ? '#f59e0b' : '#006DFF',
        opacity: 0.7,
      },
    }],
  }

  const outliers = data.filter(d => d[1] > 1000).length
  const avgResponse = Math.round(data.reduce((s, d) => s + d[1], 0) / data.length)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 요약 */}
      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { label: '전체 트랜잭션', value: data.length, color: '#1d4ed8' },
          { label: '평균 응답시간', value: `${avgResponse}ms`, color: '#059669' },
          { label: '지연 트랜잭션 (>1s)', value: outliers, color: '#dc2626' },
          { label: '정상 트랜잭션', value: data.length - outliers, color: '#059669' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Scatter 차트 */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{inst.name} — Transaction Scatter</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          {[['#006DFF','정상 (≤300ms)'], ['#f59e0b','지연 (300~1000ms)'], ['#ef4444','장시간 (>1000ms)']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />{l}
            </div>
          ))}
        </div>
        <ReactECharts option={option} style={{ height: 360 }} notMerge />
      </div>
    </div>
  )
}

// ── 메트릭 비교 탭 ───────────────────────────────
const COMPARE_COLORS = ['#006DFF', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444']

function CompareTab() {
  const [selectedInstIds, setSelectedInstIds] = useState<string[]>([
    INSTANCE_OPTIONS[0].id,
    INSTANCE_OPTIONS[1].id,
  ])
  const [metric, setMetric] = useState(METRICS[0].key)

  const metricObj = METRICS.find(m => m.key === metric)!

  const toggleInst = (id: string) => {
    setSelectedInstIds(prev => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter(i => i !== id) : prev
      }
      return prev.length < 5 ? [...prev, id] : prev
    })
  }

  const compareData = useMemo(() =>
    selectedInstIds.map((id, idx) => {
      const inst = INSTANCE_OPTIONS.find(i => i.id === id)!
      const series = genTrendSeries(
        metricObj.base + (idx * 7 - 10),
        metricObj.variance,
      )
      return { id, name: inst.name, color: COMPARE_COLORS[idx % COMPARE_COLORS.length], series }
    }),
    [selectedInstIds, metric] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const chartOption = {
    backgroundColor: 'transparent',
    grid: { top: 50, bottom: 60, left: 60, right: 20 },
    legend: {
      data: compareData.map(d => d.name),
      top: 8,
      textStyle: { fontSize: 12, color: 'var(--text-secondary)' },
    },
    xAxis: {
      type: 'time',
      axisLabel: {
        fontSize: 11, color: '#80868f',
        formatter: (v: number) => new Date(v).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      },
      splitLine: { lineStyle: { color: '#e3e7ea' } },
    },
    yAxis: {
      type: 'value',
      name: metricObj.label,
      nameTextStyle: { fontSize: 11, color: '#80868f' },
      axisLabel: { fontSize: 11, color: '#80868f' },
      splitLine: { lineStyle: { color: '#e3e7ea' } },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: 'var(--border)',
      textStyle: { fontSize: 12, color: '#282c32' },
      formatter: (params: any[]) => {
        const t = new Date(params[0].value[0]).toLocaleTimeString('ko-KR')
        return `<b>${t}</b><br/>` + params.map((p: any) =>
          `${p.marker}${p.seriesName}: <b>${p.value[1]}</b>`
        ).join('<br/>')
      },
    },
    series: compareData.map(d => ({
      name: d.name,
      type: 'line',
      data: d.series,
      smooth: true,
      symbol: 'none',
      lineStyle: { color: d.color, width: 2 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: d.color + '22' }, { offset: 1, color: d.color + '00' }] } },
    })),
  }

  const tableStats = compareData.map(d => {
    const vals = d.series.map(p => p[1])
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10
    const max = Math.round(Math.max(...vals) * 10) / 10
    const min = Math.round(Math.min(...vals) * 10) / 10
    const cur = vals[vals.length - 1]
    return { ...d, avg, max, min, cur }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 컨트롤 */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* 메트릭 선택 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>메트릭</span>
          <select value={metric} onChange={e => setMetric(e.target.value)} style={{
            border: '1px solid var(--border)', borderRadius: 4, padding: '4px 10px', fontSize: 12, background: '#fff',
          }}>
            {METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        {/* 인스턴스 선택 (최대 5개) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            인스턴스 비교 <span style={{ fontWeight: 400 }}>(최대 5개)</span>
          </span>
          {INSTANCE_OPTIONS.map((inst, idx) => {
            const selected = selectedInstIds.includes(inst.id)
            const colorIdx = selectedInstIds.indexOf(inst.id)
            const color = selected ? COMPARE_COLORS[colorIdx % COMPARE_COLORS.length] : 'var(--border)'
            return (
              <button key={inst.id} onClick={() => toggleInst(inst.id)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', border: `1px solid ${color}`, borderRadius: 4,
                background: selected ? color + '18' : '#fff',
                color: selected ? color : 'var(--text-secondary)',
                fontWeight: selected ? 600 : 400, cursor: 'pointer', fontSize: 12,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: selected ? color : '#ccc' }} />
                {inst.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* 비교 차트 */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
          {metricObj.label} — 인스턴스 비교
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
            {selectedInstIds.length}개 인스턴스 선택됨
          </span>
        </div>
        <ReactECharts option={chartOption} style={{ height: 360 }} notMerge />
      </div>

      {/* 비교 통계 테이블 */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>
          통계 비교 — {metricObj.label}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--grid-header-bg)' }}>
              {['', '인스턴스', 'CURRENT', 'AVG', 'MAX', 'MIN', 'RANGE'].map(h => (
                <th key={h} style={{ padding: '8px 14px', textAlign: h === '' ? 'center' : 'left', fontWeight: 500, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableStats.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                </td>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>{s.name}</td>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: s.color }}>{s.cur}</td>
                <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{s.avg}</td>
                <td style={{ padding: '10px 14px', color: '#dc2626' }}>{s.max}</td>
                <td style={{ padding: '10px 14px', color: '#059669' }}>{s.min}</td>
                <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{Math.round((s.max - s.min) * 10) / 10}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── AI 이상탐지 탭 ────────────────────────────────
function AnomalyTab({ inst }: { inst: typeof INSTANCE_OPTIONS[0] }) {
  const anomalies = [
    { time: '14:23:11', metric: 'CPU Usage', value: '94.2%', severity: 'critical', desc: 'CPU 임계치 초과 — 비정상 쿼리 증가 감지' },
    { time: '14:18:44', metric: 'Active Sessions', value: '28',    severity: 'warning', desc: '동시 세션 급증 — 배치 작업 충돌 의심' },
    { time: '14:15:02', metric: 'Lock Wait',      value: '12.4s',  severity: 'critical', desc: '장시간 Lock 대기 — Dead Lock 가능성' },
    { time: '14:10:30', metric: 'TPS',            value: '12',     severity: 'warning', desc: 'TPS 급격한 감소 — 처리량 저하' },
    { time: '14:05:55', metric: 'Memory Usage',   value: '92.1%',  severity: 'warning', desc: 'Memory 임계치 근접' },
  ]

  const scoreData = genTrendSeries(97, 4, 30).map(([t, v]) => [t, Math.min(100, Math.max(80, v))])

  const scoreOption = {
    backgroundColor: 'transparent',
    grid: { top: 10, bottom: 40, left: 50, right: 10 },
    xAxis: { type: 'time', axisLabel: { fontSize: 10, color: '#80868f', formatter: (v: number) => new Date(v).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) } },
    yAxis: { type: 'value', min: 80, max: 100, axisLabel: { fontSize: 10, color: '#80868f' } },
    series: [{
      type: 'line', data: scoreData, smooth: true, symbol: 'none',
      lineStyle: { color: '#1d4ed8', width: 2 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#1d4ed833' }, { offset: 1, color: '#1d4ed800' }] } },
    }],
    tooltip: { trigger: 'axis', backgroundColor: '#fff', borderColor: 'var(--border)', textStyle: { fontSize: 11 } },
  }

  const SEVERITY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    critical: { bg: '#fee2e2', color: '#dc2626', label: 'Critical' },
    warning:  { bg: '#fef3c7', color: '#d97706', label: 'Warning' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* AI Score */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>AI 이상탐지 Score</div>
          <div style={{ fontSize: 48, fontWeight: 700, color: '#1d4ed8', lineHeight: 1 }}>
            {(scoreData[scoreData.length - 1][1] as number).toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ 100점</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
              Critical {anomalies.filter(a => a.severity === 'critical').length}
            </span>
            <span style={{ background: '#fef3c7', color: '#d97706', fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
              Warning {anomalies.filter(a => a.severity === 'warning').length}
            </span>
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>Score 트렌드</div>
          <ReactECharts option={scoreOption} style={{ height: 130 }} notMerge />
        </div>
      </div>

      {/* 이상 이벤트 목록 */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>
          {inst.name} — 감지된 이상 이벤트
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--grid-header-bg)' }}>
              {['시간', '심각도', '메트릭', '값', '설명'].map(h => (
                <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 500, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {anomalies.map((a, i) => {
              const s = SEVERITY_STYLE[a.severity]
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11 }}>{a.time}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 11 }}>{s.label}</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{a.metric}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: s.color }}>{a.value}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{a.desc}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
