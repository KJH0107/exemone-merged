'use client'
import { useState, useEffect, useRef } from 'react'
import ReactECharts from 'echarts-for-react'

/* ── 목업 데이터 ── */
const STATS_EVENTS = [
  { label: 'CPU Usage',      value: 42.1, max: 100 },
  { label: 'Memory Used',    value: 68.3, max: 100 },
  { label: 'Active Session', value: 11,   max: 50  },
  { label: 'Wait Session',   value: 2,    max: 50  },
  { label: 'Long Running',   value: 0,    max: 10  },
  { label: 'Dead Lock',      value: 0,    max: 10  },
]

const SQL_FUNCTION = [
  { type: 'SELECT',   count: 1248, pct: 72 },
  { type: 'INSERT',   count: 213,  pct: 12 },
  { type: 'UPDATE',   count: 189,  pct: 11 },
  { type: 'DELETE',   count: 48,   pct: 3  },
  { type: 'FUNCTION', count: 34,   pct: 2  },
]

const OBJECTS = [
  { name: 'Tables',     count: 148, used: 84 },
  { name: 'Indexes',    count: 312, used: 91 },
  { name: 'Views',      count: 23,  used: 61 },
  { name: 'Sequences',  count: 47,  used: 100 },
  { name: 'Functions',  count: 89,  used: 45 },
]

const SESSIONS: { pid: number; user: string; db: string; state: string; wait: string; elapsed: string; sql: string }[] = [
  { pid: 31842, user: 'app_user',  db: 'demo3', state: 'active',  wait: '-',         elapsed: '0.12s', sql: 'SELECT * FROM orders WHERE status = $1 LIMIT 100' },
  { pid: 31801, user: 'app_user',  db: 'demo3', state: 'idle',    wait: '-',         elapsed: '2.45s', sql: 'idle' },
  { pid: 31755, user: 'analytics', db: 'demo3', state: 'active',  wait: 'Lock:tuple',elapsed: '8.21s', sql: 'UPDATE products SET stock = stock - 1 WHERE id = $1' },
  { pid: 31710, user: 'analytics', db: 'demo3', state: 'idle',    wait: '-',         elapsed: '0.03s', sql: 'SELECT pg_sleep(0)' },
  { pid: 31698, user: 'dba',       db: 'demo3', state: 'active',  wait: '-',         elapsed: '1.08s', sql: 'EXPLAIN ANALYZE SELECT * FROM sessions JOIN users ON ...' },
  { pid: 31620, user: 'app_user',  db: 'demo3', state: 'idle',    wait: '-',         elapsed: '14.3s', sql: 'idle' },
]

/* ── 시계열 mock ── */
function genSeries(n: number, base: number, range: number) {
  return Array.from({ length: n }, (_, i) => [i, +(base + (Math.random() - 0.5) * range).toFixed(2)])
}
const N = 30
const slowQueryData  = genSeries(N, 12, 20)
const diskPctData    = genSeries(N, 44, 6)
const diskFreeData   = genSeries(N, 18.4, 2)
const tpsData        = genSeries(N, 320, 80)
const rowsHitData    = genSeries(N, 98.2, 3)

/* ── 공통 ECharts 옵션 ── */
function lineOpt(data: number[][], color: string, label: string, yUnit = '') {
  const xLabels = Array.from({ length: N }, (_, i) => {
    const d = new Date(Date.now() - (N - i) * 5000)
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`
  })
  return {
    backgroundColor: 'transparent',
    grid: { top: 8, right: 16, bottom: 20, left: 44 },
    xAxis: {
      type: 'category', data: xLabels,
      axisLine: { lineStyle: { color: '#2a3558' } },
      axisLabel: { color: '#4b5a82', fontSize: 9, interval: 9 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#4b5a82', fontSize: 9, formatter: (v: number) => `${v}${yUnit}` },
      splitLine: { lineStyle: { color: '#1e2840', type: 'dashed' } },
    },
    series: [{
      type: 'line', data: data.map(d => d[1]),
      smooth: true, symbol: 'none',
      lineStyle: { color, width: 1.5 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + '40' }, { offset: 1, color: color + '00' }] } },
    }],
    tooltip: { trigger: 'axis', backgroundColor: '#1a2235', borderColor: '#2a3558', textStyle: { color: '#c8d0e8', fontSize: 11 } },
  }
}

/* ── 도넛 옵션 ── */
function donutOpt(pct: number) {
  return {
    backgroundColor: 'transparent',
    series: [{
      type: 'gauge', startAngle: 200, endAngle: -20, min: 0, max: 100,
      radius: '92%', center: ['50%', '60%'],
      progress: { show: true, width: 10, itemStyle: { color: '#3b82f6' } },
      axisLine: { lineStyle: { width: 10, color: [[1, '#1e2840']] } },
      axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
      pointer: { show: false },
      detail: {
        valueAnimation: true, formatter: '{value}%',
        color: '#c8d0e8', fontSize: 13, fontWeight: 700, offsetCenter: [0, '10%'],
      },
      data: [{ value: pct }],
    }],
  }
}

/* ── Trend Summary bar 옵션 ── */
function trendBarOpt(data: number[], color: string) {
  return {
    backgroundColor: 'transparent',
    grid: { top: 2, right: 2, bottom: 2, left: 2 },
    xAxis: { type: 'category', show: false, data: data.map((_, i) => i) },
    yAxis: { type: 'value', show: false },
    series: [{ type: 'bar', data, itemStyle: { color, borderRadius: 1 }, barMaxWidth: 6 }],
    tooltip: { show: false },
  }
}

/* ── SQL 분포 bar 옵션 ── */
function sqlBarOpt() {
  return {
    backgroundColor: 'transparent',
    grid: { top: 4, right: 4, bottom: 4, left: 4 },
    xAxis: { type: 'value', show: false },
    yAxis: { type: 'category', show: false, data: SQL_FUNCTION.map(s => s.type) },
    series: [{
      type: 'bar', data: SQL_FUNCTION.map(s => s.pct),
      itemStyle: { color: '#3b82f6', borderRadius: 2 },
      barMaxWidth: 8,
    }],
    tooltip: { show: false },
  }
}

/* ── 클록 훅 ── */
function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    .replace(/\. /g, '.').replace(/\./g, '.').replace(',', '')
}

/* ── HexGrid ── */
function HexGrid() {
  const colors = ['#3b82f6','#3b82f6','#3b82f6','#3b82f6','#3b82f6','#3b82f6','#3b82f6','#3b82f6','#3b82f6','#3b82f6','#3b82f6',
    '#22d3ee','#22d3ee','#22d3ee','#22d3ee','#22d3ee','#22d3ee','#22d3ee','#22d3ee','#22d3ee',
    '#1e2840','#1e2840','#1e2840','#1e2840','#1e2840','#1e2840','#1e2840','#1e2840','#1e2840','#1e2840','#1e2840']
  const R = 10, rows = 4, cols = 8
  const hexes: JSX.Element[] = []
  let ci = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * (R * 1.75) + (r % 2 === 1 ? R * 0.875 : 0) + R
      const y = r * (R * 1.52) + R
      const color = colors[ci % colors.length]; ci++
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = Math.PI / 180 * (60 * i - 30)
        return `${x + R * 0.85 * Math.cos(a)},${y + R * 0.85 * Math.sin(a)}`
      }).join(' ')
      hexes.push(<polygon key={`${r}-${c}`} points={pts} fill={color} opacity={color === '#1e2840' ? 1 : 0.85} />)
    }
  }
  return (
    <svg width="100%" viewBox={`0 0 ${cols * R * 1.75 + R * 2} ${rows * R * 1.52 + R * 2}`} style={{ maxHeight: 80 }}>
      {hexes}
    </svg>
  )
}

/* ── 메인 컴포넌트 ── */
export default function PostgreSQLSinglePage() {
  const clock = useClock()
  const [sessionOpen, setSessionOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState<Record<string, boolean>>({ vacuum: false, additional: false, alert: false })
  const [selectedPid, setSelectedPid] = useState<number | null>(null)

  const toggleAdmin = (k: string) => setAdminOpen(p => ({ ...p, [k]: !p[k] }))

  const card: React.CSSProperties = {
    background: 'var(--card-bg, #111827)',
    border: '1px solid var(--border, #1f2937)',
    borderRadius: 8,
    overflow: 'hidden',
  }

  const cardHeader: React.CSSProperties = {
    padding: '7px 12px',
    borderBottom: '1px solid var(--border, #1f2937)',
    fontSize: 11,
    fontWeight: 700,
    color: '#9baacf',
    letterSpacing: 0.4,
    background: '#0d1117',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg, #0d1117)', color: '#c8d0e8', fontFamily: 'var(--font-sans, sans-serif)', fontSize: 12, overflow: 'hidden' }}>

      {/* ── TOP BAR ── */}
      <div style={{ height: 40, flexShrink: 0, background: '#111827', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 6, zIndex: 10 }}>
        {/* 브레드크럼 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#4b5a82' }}>
          {['데이터베이스', '인스턴스', 'DB demo3', 'postgresql-1', '싱글뷰', '데이터베이스'].map((seg, i, arr) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: i === arr.length - 1 ? '#c8d0e8' : '#4b5a82', fontWeight: i === arr.length - 1 ? 600 : 400, cursor: 'pointer' }}>{seg}</span>
              {i < arr.length - 1 && <span style={{ color: '#2a3558' }}>›</span>}
            </span>
          ))}
        </div>

        {/* 필터 칩 */}
        <div style={{ marginLeft: 16, display: 'flex', gap: 4 }}>
          {['All', 'postgresql-1', 'demo3'].map((chip, i) => (
            <span key={chip} style={{ padding: '2px 8px', borderRadius: 4, background: i === 0 ? '#1d4ed8' : '#1e2840', color: i === 0 ? '#fff' : '#9baacf', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>{chip}</span>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* 라이브 클록 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', display: 'inline-block' }} />
          <span style={{ fontSize: 10, color: '#4b5a82' }}>Live</span>
          <span style={{ fontSize: 11, color: '#7c8db5', fontVariantNumeric: 'tabular-nums' }}>{clock}</span>
        </div>

        {/* 아이콘 버튼들 */}
        <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
          {['⚙', '📋', '↗'].map(ic => (
            <button key={ic} style={{ background: '#1e2840', border: 'none', color: '#9baacf', width: 26, height: 26, borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>{ic}</button>
          ))}
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* ══════════════════ LEFT ══════════════════ */}
        <div style={{ width: 240, flexShrink: 0, overflowY: 'auto', borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column', gap: 1, background: '#0d1117' }}>

          {/* Statistics & Events */}
          <div style={card}>
            <div style={cardHeader}>
              <span>Statistics &amp; Events</span>
              <span style={{ color: '#3b82f6', fontSize: 10, cursor: 'pointer' }}>상세 ›</span>
            </div>
            <div style={{ padding: '8px 10px', display: 'flex', gap: 8 }}>
              {/* bar chart */}
              <div style={{ flex: 1 }}>
                {STATS_EVENTS.map(s => (
                  <div key={s.label} style={{ marginBottom: 5 }}>
                    <div style={{ fontSize: 9, color: '#4b5a82', marginBottom: 2 }}>{s.label}</div>
                    <div style={{ height: 5, background: '#1e2840', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${(s.value / s.max) * 100}%`, background: s.value / s.max > 0.8 ? '#ef4444' : s.value / s.max > 0.6 ? '#f59e0b' : '#3b82f6', borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
              {/* values */}
              <div style={{ width: 32, flexShrink: 0 }}>
                {STATS_EVENTS.map(s => (
                  <div key={s.label} style={{ height: 23, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: 10, fontWeight: 600, color: '#c8d0e8', fontVariantNumeric: 'tabular-nums' }}>
                    {s.value}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SQL & Function */}
          <div style={card}>
            <div style={cardHeader}>
              <span>SQL &amp; Function</span>
              <span style={{ color: '#3b82f6', fontSize: 10, cursor: 'pointer' }}>상세 ›</span>
            </div>
            <div style={{ padding: '6px 10px', display: 'flex', gap: 8 }}>
              {/* table */}
              <div style={{ flex: 1 }}>
                {SQL_FUNCTION.map(s => (
                  <div key={s.type} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #1e2840' }}>
                    <span style={{ fontSize: 10, color: '#7c8db5' }}>{s.type}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#c8d0e8' }}>{s.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              {/* mini bar */}
              <div style={{ width: 50 }}>
                <ReactECharts option={sqlBarOpt()} style={{ height: 100, width: 50 }} opts={{ renderer: 'svg' }} />
              </div>
            </div>
          </div>

          {/* Object */}
          <div style={card}>
            <div style={cardHeader}>
              <span>Object</span>
            </div>
            <div style={{ padding: '6px 10px', display: 'flex', gap: 8 }}>
              {/* donut */}
              <div style={{ width: 60 }}>
                <ReactECharts option={donutOpt(73)} style={{ height: 70, width: 60 }} opts={{ renderer: 'svg' }} />
              </div>
              {/* list */}
              <div style={{ flex: 1 }}>
                {OBJECTS.map(o => (
                  <div key={o.name} style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#7c8db5', marginBottom: 1 }}>
                      <span>{o.name}</span><span>{o.count}</span>
                    </div>
                    <div style={{ height: 3, background: '#1e2840', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${o.used}%`, background: '#3b82f6', borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trend Summary */}
          <div style={card}>
            <div style={cardHeader}><span>Trend Summary</span></div>
            <div style={{ padding: '6px 10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { label: 'CPU',      data: Array.from({length:12},()=>+(Math.random()*60+10).toFixed(1)), color: '#3b82f6' },
                  { label: 'Memory',   data: Array.from({length:12},()=>+(Math.random()*40+40).toFixed(1)), color: '#a78bfa' },
                  { label: 'Session',  data: Array.from({length:12},()=>+(Math.random()*10+5).toFixed(0)),  color: '#22d3ee' },
                  { label: 'TPS',      data: Array.from({length:12},()=>+(Math.random()*200+100).toFixed(0)), color: '#f59e0b' },
                  { label: 'Disk',     data: Array.from({length:12},()=>+(Math.random()*20+30).toFixed(1)), color: '#ef4444' },
                  { label: 'Wait',     data: Array.from({length:12},()=>+(Math.random()*5).toFixed(1)),     color: '#ec4899' },
                ].map(t => (
                  <div key={t.label}>
                    <div style={{ fontSize: 9, color: '#4b5a82', marginBottom: 2 }}>{t.label}</div>
                    <ReactECharts option={trendBarOpt(t.data, t.color)} style={{ height: 28, width: '100%' }} opts={{ renderer: 'svg' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════ CENTER ══════════════════ */}
        <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid #1f2937', background: '#0d1117', display: 'flex', flexDirection: 'column', gap: 1 }}>

          {/* Overview */}
          <div style={{ ...card, margin: 0, borderRadius: 0, flex: 'none' }}>
            <div style={cardHeader}><span>Overview</span></div>
            <div style={{ padding: '12px 16px' }}>

              {/* 상단: 로고 + 연결 정보 + 게이지 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
                {/* PG 로고 */}
                <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg,#336791,#1a3a5c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', fontWeight: 800, flexShrink: 0 }}>
                  PG
                </div>

                {/* 연결 통계 */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>postgresql-1 <span style={{ fontSize: 10, color: '#4b5a82', fontWeight: 400 }}>/ demo3</span></div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    {[
                      { label: '● Active',     value: 11, color: '#22c55e' },
                      { label: '○ Idle',        value: 20, color: '#9baacf' },
                      { label: '⚠ Wait',        value: 2,  color: '#f59e0b' },
                      { label: '✕ Idle Trans',  value: 1,  color: '#4b5a82' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 9, color: '#4b5a82', whiteSpace: 'nowrap' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 게이지 */}
                <div style={{ width: 110, flexShrink: 0 }}>
                  <ReactECharts option={donutOpt(31)} style={{ height: 90, width: 110 }} opts={{ renderer: 'svg' }} />
                  <div style={{ textAlign: 'center', fontSize: 9, color: '#4b5a82', marginTop: -8 }}>Connection Usage</div>
                </div>
              </div>

              {/* HexGrid */}
              <div style={{ marginBottom: 12 }}>
                <HexGrid />
              </div>

              {/* 상태 카드 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {[
                  { label: 'Alert',       value: 0,   color: '#22c55e', sub: 'No alerts' },
                  { label: 'Vacuum',       value: 3,   color: '#f59e0b', sub: 'Running' },
                  { label: 'Replication', value: 1,   color: '#3b82f6', sub: 'Streaming' },
                  { label: 'CheckPoint',  value: 0,   color: '#22c55e', sub: 'Normal' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 6, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 9, color: '#4b5a82', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 10, color: s.color }}>{s.sub}</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* 91.47% cache hit */}
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 6, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: '#7c8db5' }}>Buffer Cache Hit Ratio</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>91.47%</span>
              </div>
            </div>
          </div>

          {/* Admin Reference (아코디언) */}
          <div style={{ ...card, margin: 0, borderRadius: 0, flex: 'none' }}>
            <div style={cardHeader}><span>Admin Reference</span></div>
            {[
              { key: 'vacuum', label: 'Vacuum', content: (
                <div style={{ padding: '8px 12px', fontSize: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    {['Running', 'Waiting', 'Oldest Age', 'Dead Tuple'].map(k => (
                      <div key={k} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#c8d0e8' }}>{k === 'Running' ? 3 : k === 'Waiting' ? 0 : k === 'Oldest Age' ? '2h 13m' : '1,248'}</div>
                        <div style={{ fontSize: 9, color: '#4b5a82' }}>{k}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#1e2840', borderRadius: 4, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                      <thead><tr style={{ background: '#111827' }}>{['Table', 'Type', 'Phase', 'Progress'].map(h => <th key={h} style={{ padding: '4px 8px', textAlign: 'left', color: '#4b5a82', fontWeight: 600 }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {[['public.orders', 'AUTO', 'index cleanup', '68%'], ['public.sessions', 'MANUAL', 'heap scan', '23%']].map(row => (
                          <tr key={row[0]} style={{ borderTop: '1px solid #1f2937' }}>
                            {row.map((c, ci) => <td key={ci} style={{ padding: '4px 8px', color: '#9baacf' }}>{c}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )},
              { key: 'additional', label: 'Additional Information', content: (
                <div style={{ padding: '8px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                  {[
                    ['PG Version', '15.3'], ['Max Connections', '200'], ['Shared Buffers', '1024 MB'],
                    ['WAL Level', 'replica'], ['Archive Mode', 'on'], ['Autovacuum', 'on'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e2840', paddingBottom: 4 }}>
                      <span style={{ color: '#4b5a82' }}>{k}</span>
                      <span style={{ color: '#c8d0e8', fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              )},
              { key: 'alert', label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Alert Logs
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 6px #ef4444' }} />
                </span>
              ), content: (
                <div style={{ padding: '6px 12px' }}>
                  {[
                    { level: 'ERROR', msg: 'could not serialize access due to concurrent update', time: '13:21:08' },
                    { level: 'WARN',  msg: 'autovacuum: table "demo3.public.orders" needs analyze', time: '13:18:44' },
                    { level: 'WARN',  msg: 'checkpoint request taking too long', time: '13:05:12' },
                  ].map((log, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid #1f2937', alignItems: 'flex-start' }}>
                      <span style={{ padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 700, background: log.level === 'ERROR' ? '#7f1d1d' : '#78350f', color: log.level === 'ERROR' ? '#fca5a5' : '#fcd34d', flexShrink: 0 }}>{log.level}</span>
                      <span style={{ fontSize: 10, color: '#9baacf', flex: 1, lineHeight: 1.4 }}>{log.msg}</span>
                      <span style={{ fontSize: 9, color: '#4b5a82', flexShrink: 0 }}>{log.time}</span>
                    </div>
                  ))}
                </div>
              )},
            ].map(item => (
              <div key={item.key} style={{ borderTop: '1px solid #1f2937' }}>
                <button onClick={() => toggleAdmin(item.key)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9baacf', fontSize: 11, fontWeight: 600 }}>
                  <span>{item.label}</span>
                  <span style={{ transition: 'transform .2s', transform: adminOpen[item.key] ? 'rotate(90deg)' : 'none', fontSize: 10 }}>›</span>
                </button>
                {adminOpen[item.key] && item.content}
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════ RIGHT ══════════════════ */}
        <div style={{ width: 300, flexShrink: 0, overflowY: 'auto', background: '#0d1117', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={cardHeader}><span>Real Time Monitor</span></div>
          {[
            { label: 'Slow Query', subtitle: '파라미터 별 Time / 누적 Elapsed Time', data: slowQueryData, color: '#ef4444', unit: '' },
            { label: 'OS Disk Percent [min/max/Mbm-E] (%)', subtitle: '', data: diskPctData, color: '#f59e0b', unit: '%' },
            { label: 'OS Disk Free [min/max/Mbm-E] (Bytes)', subtitle: '', data: diskFreeData, color: '#a78bfa', unit: '' },
            { label: 'TPS (count/sec)', subtitle: '', data: tpsData, color: '#22d3ee', unit: '' },
            { label: 'Rows Hit Ratio (%)', subtitle: '', data: rowsHitData, color: '#22c55e', unit: '%' },
          ].map(chart => (
            <div key={chart.label} style={{ ...card, margin: 0, borderRadius: 0, borderLeft: 'none', borderRight: 'none' }}>
              <div style={{ ...cardHeader, flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <span style={{ fontSize: 10 }}>{chart.label}</span>
                {chart.subtitle && <span style={{ fontSize: 9, color: '#4b5a82', fontWeight: 400 }}>{chart.subtitle}</span>}
              </div>
              <ReactECharts
                option={lineOpt(chart.data, chart.color, chart.label, chart.unit)}
                style={{ height: 90 }}
                opts={{ renderer: 'svg' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════ SESSION TAB (SLIDE-UP) ══════════════════ */}
      <div style={{
        position: 'fixed', bottom: 0, left: 220, right: 0,
        background: '#111827', borderTop: '2px solid #1f2937',
        zIndex: 100, transition: 'height .3s ease',
        height: sessionOpen ? 260 : 32,
        overflow: 'hidden',
      }}>
        {/* 헤더 */}
        <div
          onClick={() => setSessionOpen(p => !p)}
          style={{ height: 32, display: 'flex', alignItems: 'center', padding: '0 16px', cursor: 'pointer', gap: 8, background: '#0d1117', borderBottom: sessionOpen ? '1px solid #1f2937' : 'none' }}
        >
          <span style={{ fontSize: 11, color: sessionOpen ? '▼' : '▲', transition: 'transform .2s', transform: sessionOpen ? 'none' : 'none' }}>
            {sessionOpen ? '▼' : '▲'}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#9baacf' }}>Session Tab</span>
          <span style={{ fontSize: 10, color: '#4b5a82' }}>Active Session List</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {[{ color: '#22c55e', label: `Active: ${SESSIONS.filter(s=>s.state==='active').length}` }, { color: '#9baacf', label: `Idle: ${SESSIONS.filter(s=>s.state==='idle').length}` }, { color: '#f59e0b', label: 'Wait: 1' }].map(b => (
              <span key={b.label} style={{ fontSize: 10, color: b.color }}>{b.label}</span>
            ))}
          </div>
        </div>

        {/* 테이블 */}
        {sessionOpen && (
          <div style={{ height: 228, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#0d1117', position: 'sticky', top: 0 }}>
                  {['PID', 'User', 'DB', 'State', 'Wait', 'Elapsed', 'SQL'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: '#4b5a82', whiteSpace: 'nowrap', borderBottom: '1px solid #1f2937' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SESSIONS.map(s => (
                  <tr key={s.pid}
                    onClick={() => setSelectedPid(p => p === s.pid ? null : s.pid)}
                    style={{ cursor: 'pointer', background: selectedPid === s.pid ? '#1e2840' : 'transparent', borderBottom: '1px solid #1f2937' }}
                    onMouseEnter={e => { if (selectedPid !== s.pid) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,.03)' }}
                    onMouseLeave={e => { if (selectedPid !== s.pid) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                  >
                    <td style={{ padding: '5px 10px', color: '#60a5fa', fontWeight: 600 }}>{s.pid}</td>
                    <td style={{ padding: '5px 10px', color: '#9baacf' }}>{s.user}</td>
                    <td style={{ padding: '5px 10px', color: '#9baacf' }}>{s.db}</td>
                    <td style={{ padding: '5px 10px' }}>
                      <span style={{ padding: '1px 6px', borderRadius: 3, fontSize: 10, fontWeight: 600, background: s.state === 'active' ? '#14532d' : '#1e2840', color: s.state === 'active' ? '#4ade80' : '#6b7280' }}>{s.state}</span>
                    </td>
                    <td style={{ padding: '5px 10px', color: s.wait !== '-' ? '#f59e0b' : '#4b5a82' }}>{s.wait}</td>
                    <td style={{ padding: '5px 10px', color: '#9baacf', fontVariantNumeric: 'tabular-nums' }}>{s.elapsed}</td>
                    <td style={{ padding: '5px 10px', color: '#7c8db5', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sql}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
