'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import ReactECharts from 'echarts-for-react'

/* ══════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════ */
// Statistics & Events — 좌측 수평 bar
const TUP_STATS = [
  { name:'Tup Updated', val:152, pct:100 },
  { name:'Tup Inserted', val: 58, pct: 38.3 },
  { name:'Tup Deleted',  val: 11, pct:  7.2 },
  { name:'Tup Returned', val:  4, pct:  2.6 },
  { name:'Tup Fetched',  val:  1, pct:  0.7 },
]
// Statistics & Events — 우측 Top Event 표
const TOP_EVENTS = [
  { rank:1, type:'Clie...', event:'Client', cnt:16 },
  { rank:2, type:'CPU',     event:'CPU',    cnt:14 },
  { rank:3, type:'Clien...',event:'Client', cnt:12 },
]
// SQL & Function — 막대 데이터 (calls 기준, 비어있으면 빈 배열)
const SQL_CALLS:  number[] = []
const FUNC_CALLS: number[] = []
// Object — Top Object 표
const TOP_OBJECTS = [
  { name:'ora_sta...',  val:'10.2M', raw:10200 },
  { name:'last_alar...',val:' 5.1M', raw: 5100 },
  { name:'apm_db_i...',val:' 4.7M', raw: 4700 },
  { name:'ora_even...',val:' 2.3M', raw: 2300 },
  { name:'apm_aler...',val:' 1.9M', raw: 1900 },
]
// Trend Summary — 선택 가능한 지표 목록
const TREND_METRICS = [
  { id:'tps',      label:'TPS',           unit:'count', base:28,  range:15 },
  { id:'tup_upd',  label:'Tup Updated',   unit:'count', base:80,  range:60 },
  { id:'tup_ins',  label:'Tup Inserted',  unit:'count', base:40,  range:30 },
  { id:'tup_del',  label:'Tup Deleted',   unit:'count', base:12,  range:8  },
  { id:'blks_hit', label:'Blks Hit',      unit:'count', base:4800,range:400},
  { id:'cpu',      label:'CPU Usage',     unit:'%',     base:18,  range:12 },
  { id:'sessions', label:'Sessions',      unit:'count', base:32,  range:8  },
]
const ACTIVE_BACKENDS = [
  { pid:31842, userName:'app_user',  dbName:'demo3', appName:'node-postgres', clientAddr:'10.10.1.5',  clientHost:'app-server-01', backendStart:'2026-04-17 08:12:03', elapsed:0.12 },
  { pid:31801, userName:'app_user',  dbName:'demo3', appName:'node-postgres', clientAddr:'10.10.1.5',  clientHost:'app-server-01', backendStart:'2026-04-17 08:09:41', elapsed:2.45 },
  { pid:31755, userName:'analytics', dbName:'demo3', appName:'psql',          clientAddr:'10.10.2.10', clientHost:'analytics-01',  backendStart:'2026-04-17 07:55:22', elapsed:8.21 },
  { pid:31710, userName:'analytics', dbName:'demo3', appName:'psql',          clientAddr:'10.10.2.10', clientHost:'analytics-01',  backendStart:'2026-04-17 07:48:10', elapsed:0.03 },
  { pid:31698, userName:'dba',       dbName:'demo3', appName:'pgAdmin 4',     clientAddr:'10.10.0.1',  clientHost:'dba-workstation',backendStart:'2026-04-17 07:45:00', elapsed:1.08 },
  { pid:31620, userName:'app_user',  dbName:'demo3', appName:'node-postgres', clientAddr:'10.10.1.6',  clientHost:'app-server-02', backendStart:'2026-04-17 07:30:15', elapsed:14.3 },
]
const LOCK_TREE = [
  { dbName:'demo3', pid:31755, lockStatus:'waiting', holderPid:31842, userName:'analytics' },
  { dbName:'demo3', pid:31801, lockStatus:'granted', holderPid:null,  userName:'app_user'  },
  { dbName:'demo3', pid:31698, lockStatus:'granted', holderPid:null,  userName:'dba'       },
]
// Trend 시간 레이블 (10분 간격, 7포인트)
function genTrendTimes() {
  const now = Date.now()
  return Array.from({length:7}, (_,i) => {
    const d = new Date(now - (6-i)*10*60*1000)
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
  })
}
const TREND_TIMES = genTrendTimes()
function genTrendData(base: number, range: number) {
  return Array.from({length:7}, () => +(base + (Math.random()-0.5)*range*1.2).toFixed(0))
}
const VACUUM_ROWS = [
  ['public.orders',   'AUTO',   'index cleanup', '124s'],
  ['public.sessions', 'MANUAL', 'heap scan',     ' 47s'],
]

// Slow Query mock
const SQ_PIDS = [31842, 31801, 31755, 31710, 31698, 31620]
const SQ_USERS = ['app_user','analytics','dba','app_user','analytics','app_user']
const SQ_APPS  = ['node-postgres','psql','pgAdmin 4','node-postgres','psql','node-postgres']
const SQ_SQL   = [
  'SELECT pg_sleep(50 + random() * 10)',
  "SELECT * FROM order_history WHERE created_at > NOW() - INTERVAL '30 days'",
  'UPDATE sessions SET last_active = NOW() WHERE session_id = $1',
  'SELECT p.*, SUM(oi.quantity * oi.price) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.id',
  'DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL \'90 days\'',
]
function genSQTimes(n: number) {
  const now = Date.now()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now - i * 15 * 1000)
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`
  }).reverse()
}
interface SQDot { time:string; elapsed:number; pid:number; userName:string; appName:string; clientAddr:string; clientHost:string; sqlText:string }
const SQ_TICK_TIMES = genSQTimes(20)
const SQ_DOTS: SQDot[] = Array.from({ length: 18 }, (_, i) => {
  const idx = i % SQ_PIDS.length
  return {
    time:       SQ_TICK_TIMES[Math.floor(Math.random() * SQ_TICK_TIMES.length)],
    elapsed:    +(Math.random() * 60 + 8).toFixed(3),
    pid:        SQ_PIDS[idx],
    userName:   SQ_USERS[idx],
    appName:    SQ_APPS[idx],
    clientAddr: '10.10.1.5',
    clientHost: 'app-server-01',
    sqlText:    SQ_SQL[i % SQ_SQL.length],
  }
})

// RT 메트릭 — 5초 간격 120포인트 (10분)
function makeRTTimes() {
  const now = Date.now()
  return Array.from({ length: 120 }, (_, i) => {
    const t = new Date(now - (119 - i) * 5000)
    return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`
  })
}
function makeSeriesData(base: number, range: number, count = 120) {
  return Array.from({ length: count }, () => Math.max(0, base + (Math.random() - 0.5) * range * 2))
}
const SV_RT_TIMES = makeRTTimes()
const SV_RT_METRIC_POOL = [
  { id: 'blks_hit',    label: 'Blks Hit',       unit: 'count',   series: [{ name: '207 PG 15', color: '#3b82f6', data: makeSeriesData(35000, 8000) }] },
  { id: 'blks_read',   label: 'Blks Read',       unit: 'blocks',  series: [{ name: '207 PG 15', color: '#3b82f6', data: makeSeriesData(15, 10)    }] },
  { id: 'rows_hit',    label: 'Rows Hit Ratio',  unit: '%',       series: [{ name: '207 PG 15', color: '#3b82f6', data: makeSeriesData(98, 2)     }] },
  { id: 'tps',         label: 'TPS',             unit: 'count/s', series: [{ name: '207 PG 15', color: '#3b82f6', data: makeSeriesData(320, 80)   }] },
  { id: 'tup_ins',     label: 'Tup Inserted',    unit: 'count',   series: [{ name: '207 PG 15', color: '#3b82f6', data: makeSeriesData(500, 200)  }] },
  { id: 'tup_upd',     label: 'Tup Updated',     unit: 'count',   series: [{ name: '207 PG 15', color: '#3b82f6', data: makeSeriesData(200, 100)  }] },
  { id: 'tup_del',     label: 'Tup Deleted',     unit: 'count',   series: [{ name: '207 PG 15', color: '#3b82f6', data: makeSeriesData(50, 30)    }] },
  { id: 'active_sess', label: 'Active Sessions', unit: 'count',   series: [{ name: '207 PG 15', color: '#3b82f6', data: makeSeriesData(8, 4)      }] },
]

/* ══════════════════════════════════════════════════════════
   CHART OPTIONS
══════════════════════════════════════════════════════════ */
function modalLineOpt(color: string) {
  const data = Array.from({ length: 20 }, (_, i) => {
    const spike = i === 10 ? 50000 : i === 11 ? 30000 : 0
    return +(1000 + Math.random() * 2000 + spike)
  })
  return {
    backgroundColor: 'transparent',
    grid: { top:10, right:10, bottom:20, left:50 },
    xAxis: { type:'category', data:Array.from({length:20},(_,i)=>i), axisLabel:{ color:'#9fa5ae', fontSize:9 }, axisTick:{ show:false }, axisLine:{ lineStyle:{ color:'#e3e7ea' } } },
    yAxis: { type:'value', axisLabel:{ color:'#9fa5ae', fontSize:9 }, splitLine:{ lineStyle:{ color:'#e3e7ea', type:'dashed' } } },
    series:[{ type:'line', data, smooth:false, symbol:'none', lineStyle:{ color, width:1.5 }, areaStyle:{ color:color+'20' } }],
    tooltip:{ trigger:'axis', backgroundColor:'#fff', borderColor:'#c9cdd2', textStyle:{ color:'#282c32', fontSize:11 } },
  }
}
function donutOpt(pct: number) {
  return {
    backgroundColor: 'transparent',
    series:[{ type:'gauge', startAngle:200, endAngle:-20, min:0, max:100, radius:'92%', center:['50%','60%'],
      progress:{ show:true, width:10, itemStyle:{ color:'#3b82f6' } },
      axisLine:{ lineStyle:{ width:10, color:[[1,'#e3e7ea']] } },
      axisTick:{ show:false }, splitLine:{ show:false }, axisLabel:{ show:false }, pointer:{ show:false },
      detail:{ valueAnimation:true, formatter:'{value}%', color:'#282c32', fontSize:13, fontWeight:700, offsetCenter:[0,'10%'] },
      data:[{ value:pct }]
    }],
  }
}
// 반원 게이지 (Object: Index Scan vs Table Scan)
function halfGaugeOpt(tablePct: number, indexPct: number) {
  return {
    backgroundColor: 'transparent',
    series:[{
      type:'pie',
      startAngle:180, endAngle:0,
      radius:['48%','72%'],
      center:['50%','78%'],
      data:[
        { value:tablePct,  name:'Table', itemStyle:{ color:'#f97316' }, label:{ show:false } },
        { value:indexPct,  name:'Index', itemStyle:{ color:'#fb923c' }, label:{ show:false } },
        { value:tablePct+indexPct, itemStyle:{ color:'transparent', opacity:0 }, label:{ show:false }, labelLine:{ show:false }, tooltip:{ show:false } },
      ],
      silent:true,
      labelLine:{ show:false },
    }],
    tooltip:{ show:false },
  }
}
// 수직 bar (SQL & Function)
function vertBarOpt(data: number[], labels: string[], color: string) {
  return {
    backgroundColor: 'transparent',
    grid: { top:6, right:6, bottom:22, left:6 },
    xAxis: { type:'category', data:labels, axisLabel:{ color:'#9fa5ae', fontSize:8, rotate:0, overflow:'truncate', width:28 }, axisTick:{ show:false }, axisLine:{ lineStyle:{ color:'#c9cdd2' } } },
    yAxis: { type:'value', axisLabel:{ show:false }, splitLine:{ lineStyle:{ color:'#e3e7ea', type:'dashed' } }, min:0 },
    series:[{ type:'bar', data, itemStyle:{ color, borderRadius:1 }, barMaxWidth:14 }],
    tooltip:{ trigger:'axis', backgroundColor:'#fff', borderColor:'#c9cdd2', textStyle:{ color:'#282c32', fontSize:11 } },
  }
}
// Trend Summary bar (10분 간격, 7포인트)
function trendBarOpt(data: number[], times: string[]) {
  const maxVal = Math.max(...data, 1)
  return {
    backgroundColor: 'transparent',
    grid: { top:6, right:4, bottom:22, left:34 },
    xAxis: { type:'category', data:times, axisLabel:{ color:'#9fa5ae', fontSize:8, interval:1 }, axisTick:{ show:false }, axisLine:{ lineStyle:{ color:'#c9cdd2' } } },
    yAxis: { type:'value', max: Math.ceil(maxVal*1.3/10)*10, axisLabel:{ color:'#9fa5ae', fontSize:8 }, splitLine:{ lineStyle:{ color:'#e3e7ea', type:'dashed' } } },
    series:[{ type:'bar', data, itemStyle:{ color:'#3b82f6', borderRadius:1 }, barMaxWidth:18 }],
    tooltip:{ trigger:'axis', backgroundColor:'#fff', borderColor:'#c9cdd2', textStyle:{ color:'#282c32', fontSize:11 } },
  }
}

// 연결 링 게이지 — 하단(6시)에서 시작, 시계방향으로 차오름
function cpuMemGaugeOpt(cpu: number, mem: number) {
  const W = 16
  const activeGray = '#dde1e6'
  const decoGray   = '#edf0f2'
  return {
    backgroundColor: 'transparent',
    series: [
      // [0] ③ CPU 장식 — 상단 좌
      {
        type:'gauge', startAngle:-270, endAngle:-180,
        min:0, max:100, radius:'85%', center:['50%','50%'],
        progress:{ show:false },
        axisLine:{ lineStyle:{ width:W, color:[[1, decoGray]] } },
        axisTick:{ show:false }, splitLine:{ show:false }, axisLabel:{ show:false }, pointer:{ show:false },
        detail:{ show:false }, title:{ show:false },
        data:[{ value:0 }]
      },
      // [1] ④ MEM 장식 — 상단 우
      {
        type:'gauge', startAngle:0, endAngle:90,
        min:0, max:100, radius:'85%', center:['50%','50%'],
        progress:{ show:false },
        axisLine:{ lineStyle:{ width:W, color:[[1, decoGray]] } },
        axisTick:{ show:false }, splitLine:{ show:false }, axisLabel:{ show:false }, pointer:{ show:false },
        detail:{ show:false }, title:{ show:false },
        data:[{ value:0 }]
      },
      // [2] ⑤ 내부 장식 링
      {
        type:'gauge', startAngle:90, endAngle:-270,
        min:0, max:100, radius:'58%', center:['50%','50%'],
        progress:{ show:false },
        axisLine:{ lineStyle:{ width:8, color:[[1, '#edf0f2']] } },
        axisTick:{ show:false }, splitLine:{ show:false }, axisLabel:{ show:false }, pointer:{ show:false },
        detail:{ show:false }, title:{ show:false },
        data:[{ value:0 }]
      },
      // [3] ② MEM 게이지 — 하단 우 (3시→6시)
      {
        type:'gauge', startAngle:0, endAngle:-90,
        min:0, max:100, radius:'85%', center:['50%','50%'],
        progress:{ show:true, width:W, itemStyle:{ color:'#10b981' }, roundCap:false },
        axisLine:{ lineStyle:{ width:W, color:[[1, activeGray]] } },
        axisTick:{ show:false }, splitLine:{ show:false }, axisLabel:{ show:false }, pointer:{ show:false },
        detail:{ show:false }, title:{ show:false },
        data:[{ value:mem }]
      },
      // [4] ①A CPU 파란 베이스 — 하단 좌 전체 (항상 value=100)
      {
        type:'gauge', startAngle:-90, endAngle:-180,
        min:0, max:100, radius:'85%', center:['50%','50%'],
        progress:{ show:true, width:W, itemStyle:{ color:'#3b82f6' }, roundCap:false },
        axisLine:{ lineStyle:{ width:W, color:[[1, activeGray]] } },
        axisTick:{ show:false }, splitLine:{ show:false }, axisLabel:{ show:false }, pointer:{ show:false },
        detail:{ show:false }, title:{ show:false },
        data:[{ value:100 }]
      },
      // [5] ①B CPU 회색 커버 — 6시쪽부터 (100-cpu)% 가림 → 9시쪽에 cpu% 파란 아크 노출
      {
        type:'gauge', startAngle:-90, endAngle:-180,
        min:0, max:100, radius:'85%', center:['50%','50%'],
        progress:{ show:true, width:W, itemStyle:{ color:activeGray }, roundCap:false },
        axisLine:{ show:false },
        axisTick:{ show:false }, splitLine:{ show:false }, axisLabel:{ show:false }, pointer:{ show:false },
        detail:{ show:false }, title:{ show:false },
        data:[{ value:100-cpu }]
      },
    ],
    tooltip:{ show:false },
  }
}
// Slow Query scatter
function sqScatterOpt(dots: SQDot[]) {
  return {
    backgroundColor: 'transparent',
    grid: { top:6, right:8, bottom:24, left:36 },
    xAxis: { type:'category', data: SQ_TICK_TIMES, axisLabel:{ color:'#9fa5ae', fontSize:8, interval: Math.floor(SQ_TICK_TIMES.length/4) }, axisTick:{ show:false }, axisLine:{ lineStyle:{ color:'#c9cdd2' } } },
    yAxis: { type:'value', name:'sec', nameTextStyle:{ color:'#9fa5ae', fontSize:8 }, axisLabel:{ color:'#9fa5ae', fontSize:8 }, splitLine:{ lineStyle:{ color:'#e3e7ea', type:'dashed' } }, min:0 },
    series:[{ type:'scatter', symbolSize:7, data: dots.map(d=>[d.time, d.elapsed, d.pid, d.sqlText]), itemStyle:{ color:'#3b82f6', opacity:0.85 } }],
    tooltip:{ trigger:'item', formatter:(p: {data:[string,number,number,string]}) => `PID: ${p.data[2]}<br/>${p.data[1].toFixed(3)}s` },
  }
}
// SQL Elapsed List 팝업용 scatter (회색 배경)
function sqPopupScatterOpt(dots: SQDot[]) {
  return {
    backgroundColor: '#ffffff',
    grid: { top:10, right:12, bottom:28, left:44 },
    xAxis: { type:'category', data: SQ_TICK_TIMES, axisLabel:{ color:'#9fa5ae', fontSize:9, interval: Math.floor(SQ_TICK_TIMES.length/4) }, axisTick:{ show:false }, axisLine:{ lineStyle:{ color:'#c9cdd2' } } },
    yAxis: { type:'value', axisLabel:{ color:'#9fa5ae', fontSize:9 }, splitLine:{ lineStyle:{ color:'#e8ebee', type:'solid' } }, min:0 },
    series:[{ type:'scatter', symbolSize:8, data: dots.map(d=>[d.time, d.elapsed, d.pid]), itemStyle:{ color:'#f59e0b', opacity:0.9 } }],
    tooltip:{ trigger:'item', formatter:(p: {data:[string,number,number]}) => `PID: ${p.data[2]}<br/>Elapsed: ${p.data[1].toFixed(3)}s` },
  }
}

// Dead Tuple 수평 bar
function deadTupleOpt(items: {name:string; val:number}[]) {
  return {
    backgroundColor:'transparent',
    grid:{ top:4, right:8, bottom:20, left:52 },
    xAxis:{ type:'value', max:60, axisLabel:{ color:'#9fa5ae', fontSize:8 }, splitLine:{ lineStyle:{ color:'#e3e7ea', type:'dashed' } } },
    yAxis:{ type:'category', data:items.map(i=>i.name), axisLabel:{ color:'#9fa5ae', fontSize:8, width:44, overflow:'truncate' }, axisTick:{ show:false }, axisLine:{ show:false }, inverse:false },
    series:[{ type:'bar', data:items.map(i=>i.val), itemStyle:{ color:'#3b82f6', borderRadius:1 }, barMaxWidth:12 }],
    tooltip:{ trigger:'axis', backgroundColor:'#fff', borderColor:'#c9cdd2', textStyle:{ color:'#282c32', fontSize:10 } },
  }
}

/* ══════════════════════════════════════════════════════════
   FILTER BAR (database/page.tsx 의 FilterBar 와 동일한 패턴)
══════════════════════════════════════════════════════════ */
interface FilterChip {
  id: string
  field: string      // display label
  fieldKey: string   // data key
  operator: string
  value: string
}
const SQ_OPERATORS = ['==', '!=', 'like', 'not like']
const SQ_FILTER_FIELDS = [
  { key:'pid',        label:'PID',            isDefault:true  },
  { key:'sqlText',    label:'SQL Text',       isDefault:true  },
  { key:'userName',   label:'User Name',      isDefault:false },
  { key:'appName',    label:'App Name',       isDefault:false },
  { key:'clientAddr', label:'Client Address', isDefault:false },
  { key:'elapsed',    label:'Elapsed Time',   isDefault:false },
]
type FilterStep = 'idle' | 'field' | 'operator' | 'value'

function FilterBar({
  filters, onAdd, onRemove, onClear, fields,
}: {
  filters: FilterChip[]
  onAdd: (chip: FilterChip) => void
  onRemove: (id: string) => void
  onClear: () => void
  fields?: typeof SQ_FILTER_FIELDS
}) {
  const activeFields = fields ?? SQ_FILTER_FIELDS
  const [step, setStep]                 = useState<FilterStep>('idle')
  const [pendingField, setPendingField] = useState<typeof SQ_FILTER_FIELDS[0] | null>(null)
  const [pendingOp, setPendingOp]       = useState('')
  const [inputVal, setInputVal]         = useState('')
  const [navIdx, setNavIdx]             = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const valueRef     = useRef<HTMLInputElement>(null)

  const dropItems =
    step === 'field'      ? activeFields
    : step === 'operator' ? SQ_OPERATORS.map(o => ({ key:o, label:o, isDefault:false }))
    : []

  useEffect(() => {
    if (step === 'idle') return
    const h = (e: MouseEvent) => { if (!containerRef.current?.contains(e.target as Node)) reset() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [step])

  const reset = () => { setStep('idle'); setPendingField(null); setPendingOp(''); setInputVal(''); setNavIdx(0) }
  const selectField = (f: typeof activeFields[0]) => { setPendingField(f); setStep('operator'); setNavIdx(0) }
  const selectOp    = (op: string) => { setPendingOp(op); setStep('value'); setTimeout(() => valueRef.current?.focus(), 10) }
  const commit = () => {
    if (!pendingField || !pendingOp || !inputVal.trim()) return
    onAdd({ id:Date.now().toString(), field:pendingField.label, fieldKey:pendingField.key, operator:pendingOp, value:inputVal.trim() })
    reset()
  }
  const handleDropKey = (e: React.KeyboardEvent) => {
    if (step === 'field' || step === 'operator') {
      if (e.key === 'ArrowDown') { e.preventDefault(); setNavIdx(i => Math.min(i+1, dropItems.length-1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setNavIdx(i => Math.max(i-1, 0)) }
      if (e.key === 'Enter') { step === 'field' ? selectField(activeFields[navIdx]) : selectOp(SQ_OPERATORS[navIdx]) }
      if (e.key === 'Escape') reset()
    }
  }
  const isDropOpen = step === 'field' || step === 'operator'
  const chipStyle: React.CSSProperties = { display:'inline-flex', alignItems:'center', gap:4, background:'#1e3a6e', color:'#7eb3ff', borderRadius:3, padding:'2px 8px', fontSize:12, flexShrink:0 }
  const pendingStyle: React.CSSProperties = { ...chipStyle, background:'#1a2d50', color:'#93c5fd', border:'1px dashed #3b5998' }

  return (
    <div ref={containerRef} style={{ position:'relative', flex:1 }}>
      <div
        onClick={() => { if (step === 'idle') { setStep('field'); setNavIdx(0) } }}
        onKeyDown={handleDropKey}
        tabIndex={isDropOpen ? 0 : -1}
        style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:6, minHeight:34, padding:'4px 8px', cursor:step==='idle'?'text':'default', border:`1px solid ${isDropOpen||step==='value'?'#006DFF':'var(--border,#c9cdd2)'}`, borderRadius:isDropOpen?'4px 4px 0 0':4, background:'var(--card-bg,#fff)', outline:'none' }}
      >
        {filters.map(f => (
          <span key={f.id} style={chipStyle}>
            <span style={{ color:'#93c5fd' }}>{f.field}</span>
            <span style={{ color:'#7dd3fc', fontSize:11 }}> {f.operator} </span>
            <b style={{ color:'#fff' }}>{f.value}</b>
            <button onClick={e=>{e.stopPropagation();onRemove(f.id)}} style={{ background:'none', border:'none', cursor:'pointer', color:'#7eb3ff', fontSize:13, padding:0, lineHeight:1, marginLeft:2 }}>x</button>
          </span>
        ))}
        {pendingField && (
          <span style={pendingStyle}>
            <span>{pendingField.label}</span>
            {pendingOp && <span style={{ color:'#7dd3fc', fontSize:11 }}> {pendingOp}</span>}
            <button onClick={e=>{e.stopPropagation();reset()}} style={{ background:'none', border:'none', cursor:'pointer', color:'#93c5fd', fontSize:13, padding:0, lineHeight:1 }}>x</button>
          </span>
        )}
        {step === 'value' && (
          <input ref={valueRef} value={inputVal} onChange={e=>setInputVal(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();commit()}if(e.key==='Escape')reset()}}
            placeholder="Enter value and press Enter"
            style={{ flex:1, minWidth:120, border:'none', outline:'none', fontSize:12, background:'transparent', color:'var(--text-primary,#282c32)' }}
          />
        )}
        {step !== 'value' && <span style={{ fontSize:14, color:step==='idle'?'var(--text-muted,#80868f)':'#006DFF', lineHeight:1 }}>|</span>}
        {(filters.length > 0 || step !== 'idle') && (
          <button onClick={e=>{e.stopPropagation();reset();onClear()}} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted,#80868f)', fontSize:18, padding:'0 4px', lineHeight:1 }}>x</button>
        )}
      </div>
      {isDropOpen && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:450, background:'#fff', border:'1px solid #006DFF', borderTop:'none', borderRadius:'0 0 6px 6px', boxShadow:'0 6px 20px rgba(0,0,0,.25)', maxHeight:260, display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'8px 14px', fontSize:12, fontWeight:700, color:'#111', borderBottom:'1px solid #f0f0f0', background:'#fafafa' }}>
            {step === 'field' ? 'Filter Category' : 'Filter Inequality Sign'}
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {dropItems.map((item, i) => (
              <div key={item.key}
                onClick={() => step==='field' ? selectField(activeFields[i]) : selectOp(SQ_OPERATORS[i])}
                onMouseEnter={() => setNavIdx(i)}
                style={{ padding:'9px 16px', fontSize:13, cursor:'pointer', background:i===navIdx?'#eff6ff':'transparent', color:i===navIdx?'#1d4ed8':'#333', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid #f8f8f8' }}
              >
                {item.label}
                {item.isDefault && <span style={{ fontSize:11, background:'#3b82f6', color:'#fff', padding:'1px 8px', borderRadius:3, fontWeight:600 }}>Default</span>}
              </div>
            ))}
          </div>
          <div style={{ padding:'6px 14px', borderTop:'1px solid #f0f0f0', background:'#fafafa', display:'flex', gap:20, fontSize:11, color:'#999' }}>
            <span>↑↓ navigate</span><span>Enter select</span><span>Esc close</span>
          </div>
        </div>
      )}
    </div>
  )
}

// HexGrid: 1 hex = 5 sessions, Active=진파랑, Idle=연파랑, 빈칸=중간회색
function HexGrid({ activeSessions, idleSessions }: { activeSessions: number; idleSessions: number }) {
  const R = 15, rows = 3, cols = 20
  const activeHex = Math.ceil(activeSessions / 5)
  const idleHex   = Math.ceil(idleSessions   / 5)

  function hexColor(idx: number): [string, string] {
    if (idx < activeHex)            return ['#3b82f6', '#2563eb']  // Active — 진파랑 [fill, stroke]
    if (idx < activeHex + idleHex) return ['#93c5fd', '#60a5fa']  // Idle   — 연파랑
    return ['#c8cdd3', '#b0b6be']                                   // 빈칸   — 중간회색 (배경과 구분)
  }

  const hexes: React.ReactElement[] = []
  let ci = 0
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = c * (R * 1.78) + (r % 2 === 1 ? R * 0.89 : 0) + R
    const y = r * (R * 1.56) + R
    const [fill, stroke] = hexColor(ci++)
    const pts = Array.from({ length:6 }, (_, i) => {
      const a = Math.PI / 180 * (60 * i - 30)
      return `${+(x + R * 0.88 * Math.cos(a)).toFixed(2)},${+(y + R * 0.88 * Math.sin(a)).toFixed(2)}`
    }).join(' ')
    hexes.push(<polygon key={`${r}-${c}`} points={pts} fill={fill} stroke={stroke} strokeWidth="0.8" />)
  }
  const vw = cols * R * 1.78 + R * 2
  const vh = rows * R * 1.56 + R * 2
  return (
    <svg width="100%" viewBox={`0 0 ${vw} ${vh}`} style={{ display:'block' }}>
      {hexes}
    </svg>
  )
}

/* LiveClock */
function LiveClock() {
  const [now, setNow] = useState<string | null>(null)
  useEffect(() => {
    const fmt = () => new Date().toLocaleString('ko-KR',{ year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false }).replace(/\. /g,'.').replace(',','')
    setNow(fmt())
    const t = setInterval(() => setNow(fmt()), 1000)
    return () => clearInterval(t)
  }, [])
  return <span style={{ fontSize:11, color:'var(--text-secondary,#626872)', fontVariantNumeric:'tabular-nums' }}>{now}</span>
}

/* ══════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════ */
const S = {
  card:   { background:'var(--card-bg,#fff)', border:'1px solid var(--border,#c9cdd2)', borderRadius:0, overflow:'hidden' } as React.CSSProperties,
  hdr:    { padding:'7px 12px', borderBottom:'1px solid var(--border,#c9cdd2)', fontSize:11, fontWeight:700, color:'var(--text-muted,#80868f)', letterSpacing:0.4, background:'var(--grid-header-bg,#edf0f2)', display:'flex', alignItems:'center', justifyContent:'space-between' } as React.CSSProperties,
  page:   { display:'flex', flexDirection:'column' as const, height:'100vh', background:'var(--main-bg,#e3e7ea)', color:'var(--text-primary,#282c32)', fontSize:12, overflow:'hidden' },
  topbar: { height:40, flexShrink:0, background:'var(--card-bg,#fff)', borderBottom:'1px solid var(--border,#c9cdd2)', display:'flex', alignItems:'center', padding:'0 16px', gap:6, zIndex:10 } as React.CSSProperties,
  left:   { overflowY:'auto' as const, display:'flex', flexDirection:'column' as const, gap:1, background:'var(--card-bg,#fff)', minHeight:0 } as React.CSSProperties,
  center: { overflowY:'auto' as const, display:'flex', flexDirection:'column' as const, gap:1, background:'var(--card-bg,#fff)', minHeight:0 } as React.CSSProperties,
  right:  { overflowY:'auto' as const, display:'flex', flexDirection:'column' as const, gap:1, background:'var(--card-bg,#fff)', minHeight:0 } as React.CSSProperties,
}

/* ══════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════ */
function SVRTLineChart({ metric, height = 80 }: { metric: typeof SV_RT_METRIC_POOL[0]; height?: number | string }) {
  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { show: false },
    xAxis: { type: 'category', data: SV_RT_TIMES, axisLabel: { color: '#9fa5ae', fontSize: 9, interval: 11, formatter: (v: string) => v.slice(0, 5) }, axisLine: { lineStyle: { color: '#c9cdd2' } }, splitLine: { show: false } },
    yAxis: { type: 'value', axisLabel: { color: '#9fa5ae', fontSize: 9 }, splitLine: { lineStyle: { color: '#e3e7ea', type: 'dashed' } } },
    series: metric.series.map(s => ({
      name: s.name, type: 'line', data: s.data,
      lineStyle: { width: 1.5, color: s.color }, itemStyle: { color: s.color },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: s.color + '30' }, { offset: 1, color: s.color + '00' }] } },
      symbol: 'none', smooth: false,
    })),
    grid: { left: 44, right: 10, top: 8, bottom: 20 },
  }
  return <ReactECharts option={option} style={{ height }} opts={{ renderer: 'svg' }} />
}

export default function PostgreSQLSingleView() {
  const [bottomTab, setBottomTab]   = useState<'active'|'lock'>('active')
  const [bottomOpen, setBottomOpen] = useState(false)
  const [adminOpen, setAdminOpen]   = useState<Record<string,boolean>>({ vacuum:true, alert:false, additional:false })
  const [slotModal, setSlotModal]   = useState<null|{ title:string; color:string }>(null)
  const [expandRight, setExpandRight] = useState(false)
  // Slow Query — SQL Elapsed List 팝업
  const [sqModal, setSqModal]       = useState(false)
  // Slow Query — PID 세션 패널 (팝업 내부 우측 슬라이드)
  const [sqPidPanel, setSqPidPanel] = useState<number|null>(null)
  // SQL Text 미니 팝업
  const [sqlTextPopup, setSqlTextPopup] = useState<string|null>(null)
  // Slow Query — 차트 높이 (리사이즈)
  const [sqPanelChartH, setSqPanelChartH] = useState(120)
  const [sqPopupChartH, setSqPopupChartH] = useState(160)
  // Slow Query — 팝업 크기 (리사이즈)
  const [sqPopupW, setSqPopupW] = useState(900)
  const [sqPopupH, setSqPopupH] = useState(600)
  // Slow Query — 필터 (FilterBar 패턴)
  const [sqFilters, setSqFilters]       = useState<FilterChip[]>([])
  const [sqFilterMode, setSqFilterMode] = useState<'OR'|'AND'>('OR')

  // CPU / MEM 시뮬레이터 — echartsInstance 직접 제어 (React re-render 없이 게이지 업데이트)
  const [cpuVal, setCpuVal] = useState(45)
  const [memVal, setMemVal] = useState(72)
  const cpuRef = useRef(45)
  const memRef = useRef(72)
  const gaugeEchartsRef = useRef<any>(null)
  useEffect(() => {
    const walk = (prev: number, min: number, max: number, step: number) =>
      Math.min(max, Math.max(min, prev + (Math.random() - 0.5) * step * 2))
    const t = setInterval(() => {
      const newCpu = Math.round(walk(cpuRef.current, 20, 92, 8))
      const newMem = Math.round(walk(memRef.current, 55, 88, 4))
      cpuRef.current = newCpu
      memRef.current = newMem
      // 박스 수치 업데이트 (DOM)
      setCpuVal(newCpu)
      setMemVal(newMem)
      // 게이지 아크 업데이트 — ECharts 인스턴스 직접 호출 (컴포넌트 re-render 없음)
      const inst = gaugeEchartsRef.current?.getEchartsInstance?.()
      if (inst) {
        inst.setOption({ series: [
          {},                                  // [0] ③ deco: no update
          {},                                  // [1] ④ deco: no update
          {},                                  // [2] ⑤ inner ring: no update
          { data:[{ value:newMem }] },         // [3] ②: MEM
          { data:[{ value:100 }] },            // [4] ①A: always 100
          { data:[{ value:100-newCpu }] },     // [5] ①B: gray cover
        ] })
      }
    }, 2000)
    return () => clearInterval(t)
  }, [])

  // 차트 높이 리사이즈 핸들러
  function startResize(e: React.MouseEvent, current: number, setter: (h: number) => void) {
    e.preventDefault()
    const startY = e.clientY, startH = current
    const onMove = (ev: MouseEvent) => setter(Math.max(60, Math.min(400, startH + ev.clientY - startY)))
    const onUp   = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // 팝업 창 리사이즈 핸들러 (우 / 하 / 우하 모서리)
  function startPopupResize(e: React.MouseEvent, dir: 'e'|'s'|'se') {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX, startY = e.clientY
    const startW = sqPopupW, startH = sqPopupH
    const minW = 600, minH = 400
    const maxW = window.innerWidth  * 0.96
    const maxH = window.innerHeight * 0.92
    const onMove = (ev: MouseEvent) => {
      if (dir === 'e'  || dir === 'se') setSqPopupW(Math.max(minW, Math.min(maxW, startW + ev.clientX - startX)))
      if (dir === 's'  || dir === 'se') setSqPopupH(Math.max(minH, Math.min(maxH, startH + ev.clientY - startY)))
    }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // 필터 적용 로직 (database/page.tsx ActiveSessionTab 과 동일)
  function applyFilter(d: SQDot, f: FilterChip): boolean {
    const val  = String((d as unknown as Record<string,unknown>)[f.fieldKey] ?? '').toLowerCase()
    const fval = f.value.toLowerCase()
    switch (f.operator) {
      case '==':       return val === fval
      case '!=':       return val !== fval
      case 'like':     return val.includes(fval)
      case 'not like': return !val.includes(fval)
      default:         return true
    }
  }
  const sqFiltered = useMemo(() => {
    const rows = [...SQ_DOTS]
    const filtered = sqFilters.length === 0 ? rows
      : sqFilterMode === 'OR'
        ? rows.filter(d => sqFilters.some(f  => applyFilter(d, f)))
        : rows.filter(d => sqFilters.every(f => applyFilter(d, f)))
    return filtered.sort((a,b) => b.elapsed - a.elapsed)
  }, [sqFilters, sqFilterMode])

  // Trend Summary — 2슬롯 선택 상태
  const [trendSlots, setTrendSlots] = useState<[string, string]>(['tps', 'tup_upd'])
  const [trendPicker, setTrendPicker] = useState<number|null>(null) // 0 or 1 = 선택 드롭다운 열린 슬롯
  const [rtSelected, setRtSelected]   = useState(['blks_hit', 'rows_hit', 'tps'])
  const [rtSlideOpen, setRtSlideOpen] = useState<number|null>(null)
  // accordion: 하나만 열림 — 이미 열린 항목 클릭하면 닫힘
  const toggleAdmin = (k: string) => setAdminOpen(p => {
    const next: Record<string,boolean> = { vacuum:false, alert:false, additional:false }
    if (!p[k]) next[k] = true   // 닫혀있으면 열기, 열려있으면 닫기(그냥 false 유지)
    return next
  })

  const trendDataMap = useMemo(() =>
    Object.fromEntries(TREND_METRICS.map(m => [m.id, genTrendData(m.base, m.range)])),
  [])

  return (
    <div style={S.page}>

      {/* ── TOP BAR ── */}
      <div style={S.topbar}>
        <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--text-muted,#80868f)' }}>
          {['PostgreSQL','싱글 뷰','207 PG 15','데이터베이스(DB서)','싱글뷰'].map((seg, i, arr) => (
            <span key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ color:i===arr.length-1?'var(--text-primary,#282c32)':'var(--text-muted,#80868f)', fontWeight:i===arr.length-1?600:400, cursor:'pointer' }}>{seg}</span>
              {i < arr.length-1 && <span style={{ color:'var(--border,#c9cdd2)' }}>›</span>}
            </span>
          ))}
        </div>
        <div style={{ flex:1 }} />
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 6px #22c55e', display:'inline-block' }} />
          <span style={{ fontSize:10, color:'var(--text-muted,#80868f)' }}>Live</span>
          <LiveClock />
          <span style={{ padding:'3px 10px', background:'#fee2e2', color:'#dc2626', borderRadius:4, fontSize:10, fontWeight:700, cursor:'pointer' }}>0 ⚠</span>
          <button
            onClick={() => setExpandRight(p => !p)}
            style={{ padding:'3px 10px', fontSize:10, fontWeight:600, borderRadius:4, border:'1px solid var(--border,#c9cdd2)', background:expandRight?'#1d4ed8':'var(--card-bg,#fff)', color:expandRight?'#fff':'var(--text-secondary,#626872)', cursor:'pointer' }}
          >{expandRight ? 'Collapse' : 'Expand'}</button>
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns:expandRight ? '1fr' : '1fr 1fr 1fr', overflow:'hidden', paddingBottom:bottomOpen ? 292 : 32, gap:1, background:'var(--border,#c9cdd2)' }}>

        {/* ══ LEFT ══ */}
        {!expandRight && (
          <div style={S.left}>

            {/* Grouping Summary */}
            <div style={{ padding:'6px 12px', fontSize:11, fontWeight:700, color:'var(--text-secondary,#626872)', borderBottom:'1px solid var(--border,#c9cdd2)', background:'var(--card-bg,#fff)' }}>
              Grouping Summary
            </div>

            {/* ── Statistics & Events ── */}
            <div style={S.card}>
              <div style={S.hdr}><span>Statistics &amp; Events</span></div>
              <div style={{ padding:'6px 10px 8px', display:'flex', gap:8 }}>
                {/* 좌: 수평 bar — Tup 통계 */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:9, color:'var(--text-muted,#80868f)', marginBottom:6 }}>
                    Top Diff Statistics(Sum) for <span style={{ color:'#f97316', fontWeight:700 }}>10min</span>
                  </div>
                  {TUP_STATS.map(s => (
                    <div key={s.name} style={{ marginBottom:5 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                        <span style={{ fontSize:9, color:'var(--text-secondary,#626872)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:80 }}>{s.name}</span>
                        {s.pct >= 30 && <span style={{ fontSize:9, color:'#3b82f6', fontWeight:700, flexShrink:0 }}>{s.pct}%</span>}
                      </div>
                      <div style={{ height:9, background:'var(--main-bg,#e3e7ea)', borderRadius:2, overflow:'hidden' }}>
                        <div style={{ width:`${s.pct}%`, height:'100%', background: s.pct > 50 ? '#3b82f6' : '#c9cdd2', borderRadius:2, transition:'width .3s' }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:8, color:'var(--text-muted,#80868f)', marginTop:2 }}>
                    {[0,50,100,150].map(v=><span key={v}>{v}</span>)}
                  </div>
                </div>
                {/* 우: Top Event 표 */}
                <div style={{ width:130, flexShrink:0 }}>
                  <div style={{ fontSize:9, color:'var(--text-muted,#80868f)', marginBottom:6 }}>
                    Top Event for <span style={{ color:'#f97316', fontWeight:700 }}>10min</span>
                  </div>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:9 }}>
                    <thead>
                      <tr style={{ background:'var(--grid-header-bg,#edf0f2)' }}>
                        <th style={{ padding:'2px 4px', color:'var(--text-muted,#80868f)', fontWeight:600, textAlign:'left' }}> </th>
                        <th style={{ padding:'2px 4px', color:'var(--text-muted,#80868f)', fontWeight:600, textAlign:'left' }}>Type</th>
                        <th style={{ padding:'2px 4px', color:'var(--text-muted,#80868f)', fontWeight:600, textAlign:'left' }}>Event</th>
                        <th style={{ padding:'2px 4px', color:'var(--text-muted,#80868f)', fontWeight:600, textAlign:'right' }}>Cnt</th>
                      </tr>
                    </thead>
                    <tbody>{TOP_EVENTS.map(e=>(
                      <tr key={e.rank} style={{ borderBottom:'1px solid var(--border-light,#d8dbde)' }}>
                        <td style={{ padding:'2px 4px', color:'var(--text-muted,#80868f)', fontWeight:700 }}>{e.rank}st</td>
                        <td style={{ padding:'2px 4px', color:'var(--text-secondary,#626872)', maxWidth:34, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.type}</td>
                        <td style={{ padding:'2px 4px', color:'var(--text-secondary,#626872)', maxWidth:36, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.event}</td>
                        <td style={{ padding:'2px 4px', color:'var(--text-primary,#282c32)', fontWeight:700, textAlign:'right' }}>{e.cnt}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── SQL & Function ── */}
            <div style={S.card}>
              <div style={S.hdr}><span>SQL &amp; Function</span></div>
              <div style={{ padding:'6px 10px 8px', display:'flex', gap:8 }}>
                {/* 좌: Top SQL bar */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:9, color:'var(--text-muted,#80868f)', marginBottom:4, lineHeight:1.4 }}>
                    Top SQL for <span style={{ color:'#f97316', fontWeight:700 }}>10min</span> Order By <span style={{ color:'#3b82f6', fontWeight:700, cursor:'pointer' }}>Calls</span> <span style={{ fontSize:8 }}>↗</span>
                  </div>
                  {SQL_CALLS.length > 0
                    ? <ReactECharts option={vertBarOpt(SQL_CALLS, SQL_CALLS.map((_,i)=>`SQL${i+1}`), '#3b82f6')} style={{ height:90 }} opts={{ renderer:'svg' }} />
                    : <div style={{ height:90, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'var(--text-muted,#80868f)', border:'1px dashed var(--border,#c9cdd2)', borderRadius:4 }}>데이터가 없습니다.</div>
                  }
                </div>
                {/* 우: Top Function */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:9, color:'var(--text-muted,#80868f)', marginBottom:4, lineHeight:1.4 }}>
                    Top Function for <span style={{ color:'#f97316', fontWeight:700 }}>10min</span> Order By <span style={{ color:'#3b82f6', fontWeight:700, cursor:'pointer' }}>Calls</span> <span style={{ fontSize:8 }}>↗</span>
                  </div>
                  {FUNC_CALLS.length > 0
                    ? <ReactECharts option={vertBarOpt(FUNC_CALLS, FUNC_CALLS.map((_,i)=>`Fn${i+1}`), '#a78bfa')} style={{ height:90 }} opts={{ renderer:'svg' }} />
                    : <div style={{ height:90, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'var(--text-muted,#80868f)', border:'1px dashed var(--border,#c9cdd2)', borderRadius:4 }}>데이터가 없습니다.</div>
                  }
                </div>
              </div>
            </div>

            {/* ── Object ── */}
            <div style={S.card}>
              <div style={S.hdr}><span>Object</span></div>
              <div style={{ padding:'6px 10px 8px', display:'flex', gap:8 }}>
                {/* 좌: 반원 게이지 */}
                <div style={{ flex:1, minWidth:0, position:'relative' }}>
                  <div style={{ fontSize:9, color:'var(--text-muted,#80868f)', marginBottom:2 }}>Index Scan vs. Table Scan</div>
                  <div style={{ position:'relative' }}>
                    <ReactECharts option={halfGaugeOpt(1, 99)} style={{ height:100 }} opts={{ renderer:'svg' }} />
                    <div style={{ position:'absolute', top:'44%', left:0, right:0, textAlign:'center', fontSize:11, fontWeight:700, color:'var(--text-muted,#80868f)' }}>VS</div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, marginTop:-8, padding:'0 2px' }}>
                      <span style={{ color:'var(--text-muted,#80868f)' }}>Table<br/><b style={{ color:'#f97316' }}>1%</b></span>
                      <span style={{ color:'var(--text-muted,#80868f)', textAlign:'right' }}>Index<br/><b style={{ color:'#f97316' }}>99%</b></span>
                    </div>
                  </div>
                </div>
                {/* 우: Top Object 표 */}
                <div style={{ width:130, flexShrink:0 }}>
                  <div style={{ fontSize:9, color:'var(--text-muted,#80868f)', marginBottom:6 }}>
                    Top Object for <span style={{ color:'#f97316', fontWeight:700 }}>10min</span> Order By Scan
                  </div>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:9 }}>
                    <thead>
                      <tr style={{ background:'var(--grid-header-bg,#edf0f2)' }}>
                        <th style={{ padding:'2px 4px', color:'var(--text-muted,#80868f)', fontWeight:600, textAlign:'left' }}> </th>
                        <th style={{ padding:'2px 4px', color:'var(--text-muted,#80868f)', fontWeight:600, textAlign:'left' }}>Name</th>
                        <th style={{ padding:'2px 4px', color:'var(--text-muted,#80868f)', fontWeight:600, textAlign:'right' }}>Scan</th>
                      </tr>
                    </thead>
                    <tbody>{TOP_OBJECTS.map((o, i)=>(
                      <tr key={o.name} style={{ borderBottom:'1px solid var(--border-light,#d8dbde)' }}>
                        <td style={{ padding:'2px 4px', color:'var(--text-muted,#80868f)', fontWeight:700 }}>{i+1}st</td>
                        <td style={{ padding:'2px 4px', color:'var(--text-secondary,#626872)', maxWidth:58, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.name}</td>
                        <td style={{ padding:'2px 4px', color:'#3b82f6', fontWeight:600, textAlign:'right' }}>{o.val}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── Trend Summary ── */}
            <div style={{ ...S.card, position:'relative', flex:1 }}>
              <div style={S.hdr}><span>Trend Summary</span></div>
              <div style={{ padding:'8px 10px 10px' }}>
                {trendSlots.map((metricId, slotIdx) => {
                  const meta = TREND_METRICS.find(m => m.id === metricId)!
                  const data = trendDataMap[metricId] ?? []
                  return (
                    <div key={slotIdx} style={{ marginBottom: slotIdx === 0 ? 14 : 0 }}>
                      {/* 지표명 — 클릭하면 picker 열림 */}
                      <div style={{ fontSize:9, color:'var(--text-muted,#80868f)', marginBottom:4, display:'flex', alignItems:'center', gap:4 }}>
                        <span>DB Stat:</span>
                        <span
                          onClick={() => setTrendPicker(p => p === slotIdx ? null : slotIdx)}
                          style={{ color:'#3b82f6', fontWeight:700, cursor:'pointer', borderBottom:'1px solid #3b82f6', lineHeight:1.2 }}
                        >{meta.label}</span>
                        <span>({meta.unit})</span>
                        <span style={{ fontSize:8, color:'#3b82f6', cursor:'pointer' }}>↗</span>
                      </div>
                      {/* 지표 선택 드롭다운 */}
                      {trendPicker === slotIdx && (
                        <div style={{ position:'absolute', left:8, zIndex:50, background:'#fff', border:'1px solid var(--border,#c9cdd2)', borderRadius:6, boxShadow:'0 4px 16px rgba(0,0,0,.12)', minWidth:160, padding:'4px 0', fontSize:10 }}>
                          {TREND_METRICS.map(m => (
                            <div
                              key={m.id}
                              onClick={() => {
                                const next: [string,string] = [...trendSlots] as [string,string]
                                next[slotIdx] = m.id
                                setTrendSlots(next)
                                setTrendPicker(null)
                              }}
                              style={{ padding:'5px 12px', cursor:'pointer', color: m.id===metricId ? '#1d4ed8' : 'var(--text-secondary,#626872)', background: m.id===metricId ? '#eff6ff' : 'transparent', fontWeight: m.id===metricId ? 700 : 400 }}
                              onMouseEnter={e => { if (m.id !== metricId) (e.currentTarget as HTMLDivElement).style.background='var(--main-bg,#e3e7ea)' }}
                              onMouseLeave={e => { if (m.id !== metricId) (e.currentTarget as HTMLDivElement).style.background='transparent' }}
                            >DB Stat: {m.label} ({m.unit})</div>
                          ))}
                        </div>
                      )}
                      {/* bar 차트 */}
                      <ReactECharts option={trendBarOpt(data, TREND_TIMES)} style={{ height:100, width:'100%' }} opts={{ renderer:'svg' }} />
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}

        {/* ══ CENTER ══ */}
        {!expandRight && (
          <div style={S.center}>

            {/* ── Overview ── */}
            <div style={{ ...S.card, flexShrink:0, background:'var(--main-bg,#e3e7ea)', border:'none' }}>
              <div style={{ padding:'10px 16px 4px', fontSize:14, fontWeight:700, color:'var(--text-primary,#282c32)' }}>Overview</div>

              {/* DB Info + 링 게이지 */}
              <div style={{ padding:'8px 16px 12px', display:'flex', alignItems:'center', gap:16, justifyContent:'space-between' }}>

                {/* 좌: Logo + Active/Idle 카드 */}
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <div style={{ width:28, height:28, borderRadius:6, background:'linear-gradient(135deg,#336791,#1a3a5c)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#fff', fontWeight:800, flexShrink:0 }}>PG</div>
                    <span style={{ fontSize:10, fontWeight:600, color:'var(--text-secondary,#626872)' }}>PostgreSQL</span>
                  </div>
                  {[
                    { label:'Active', value:0,  color:'#3b82f6', maxBar:100 },
                    { label:'Idle',   value:59, color:'#60d0e8', maxBar:100 },
                  ].map(s => (
                    <div key={s.label} style={{ background:'var(--card-bg,#fff)', border:'1px solid var(--border,#c9cdd2)', borderRadius:8, padding:'8px 12px', minWidth:140 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                        <div style={{ width:10, height:10, borderRadius:'50%', background:s.color, flexShrink:0 }} />
                        <span style={{ fontSize:10, color:'var(--text-muted,#80868f)' }}>{s.label}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
                        <span style={{ fontSize:22, fontWeight:700, color:'var(--text-primary,#282c32)', lineHeight:1 }}>{s.value}</span>
                        <div style={{ flex:1, height:5, background:'var(--border,#c9cdd2)', borderRadius:3, overflow:'hidden', marginBottom:4 }}>
                          <div style={{ width:`${Math.min(s.value/s.maxBar*100, 100)}%`, minWidth: s.value>0?'4px':'0', height:'100%', background:s.color, borderRadius:3 }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 중앙: CPU / MEM 반원 하단 게이지 */}
                <div style={{ flex:1, minWidth:220, maxWidth:280, flexShrink:0, position:'relative', display:'flex', flexDirection:'column', alignItems:'center' }}>
                  <ReactECharts ref={gaugeEchartsRef} option={cpuMemGaugeOpt(cpuVal, memVal)} style={{ height:210, width:'100%' }} />
                  {/* 중앙: Connection 라벨(위) + 퍼센트(아래) */}
                  <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none' }}>
                    <div style={{ fontSize:10, fontWeight:600, color:'var(--text-muted,#80868f)', letterSpacing:0.5, marginBottom:2 }}>Connection</div>
                    <div style={{ fontSize:22, fontWeight:800, color:'var(--text-primary,#282c32)', lineHeight:1 }}>18%</div>
                  </div>
                  {/* CPU 박스 */}
                  <div style={{ position:'absolute', top:'50%', left:0, transform:'translateY(-50%)', background:'#fff', border:'1px solid var(--border,#c9cdd2)', borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,.10)', padding:'6px 8px', textAlign:'center', minWidth:52 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#3b82f6', lineHeight:1.1, fontVariantNumeric:'tabular-nums' }}>{cpuVal}%</div>
                    <div style={{ fontSize:9, color:'var(--text-muted,#80868f)', marginTop:3, fontWeight:600 }}>CPU</div>
                  </div>
                  {/* MEM 박스 */}
                  <div style={{ position:'absolute', top:'50%', right:0, transform:'translateY(-50%)', background:'#fff', border:'1px solid var(--border,#c9cdd2)', borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,.10)', padding:'6px 8px', textAlign:'center', minWidth:52 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#10b981', lineHeight:1.1, fontVariantNumeric:'tabular-nums' }}>{memVal}%</div>
                    <div style={{ fontSize:9, color:'var(--text-muted,#80868f)', marginTop:3, fontWeight:600 }}>MEM</div>
                  </div>
                  {/* 하단 100% 마커 (두 아크가 만나는 지점) */}
                  <div style={{ position:'absolute', bottom:'6%', left:'50%', transform:'translateX(-50%)', fontSize:9, color:'#b0b6be', letterSpacing:0.3, whiteSpace:'nowrap' }}>100%</div>
                </div>

                {/* 우: Lock/Long 카드 */}
                <div style={{ display:'flex', flexDirection:'column', gap:6, paddingTop:34 }}>
                  {[
                    { label:'Lock', value:0, color:'#ef4444' },
                    { label:'Long', value:0, color:'#f59e0b' },
                  ].map(s => (
                    <div key={s.label} style={{ background:'var(--card-bg,#fff)', border:'1px solid var(--border,#c9cdd2)', borderRadius:8, padding:'8px 12px', minWidth:140 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                        <div style={{ width:10, height:10, borderRadius:'50%', background:s.color, flexShrink:0 }} />
                        <span style={{ fontSize:10, color:'var(--text-muted,#80868f)' }}>{s.label}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
                        <span style={{ fontSize:22, fontWeight:700, color:'var(--text-primary,#282c32)', lineHeight:1 }}>{s.value}</span>
                        <div style={{ flex:1, height:5, background:'var(--border,#c9cdd2)', borderRadius:3, overflow:'hidden', marginBottom:4 }}>
                          <div style={{ width:`${Math.min(s.value, 100)}%`, minWidth: s.value>0?'4px':'0', height:'100%', background:s.color, borderRadius:3 }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 헥사곤 그리드 — Active:0, Idle:59 */}
              <div style={{ padding:'0 12px 8px' }}><HexGrid activeSessions={0} idleSessions={59} /></div>

              {/* 인포 카드 4개 — 1행 */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, padding:'8px 12px 12px' }}>

                {/* Alert */}
                <div style={{ background:'var(--card-bg,#fff)', border:'1px solid var(--border,#c9cdd2)', borderRadius:6, padding:'8px 10px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text-secondary,#626872)', marginBottom:8, display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ color:'#f59e0b' }}>▲</span> Alert
                  </div>
                  {[['Critical','0','#ef4444'],['Warning','0','#f59e0b']].map(([k,v,c])=>(
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:10 }}>
                      <span style={{ color:'var(--text-muted,#80868f)' }}>{k}</span>
                      <span style={{ color:c, fontWeight:700 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ borderTop:'1px solid var(--border-light,#d8dbde)', marginTop:6, paddingTop:6 }}>
                    <div style={{ fontSize:9, color:'var(--text-muted,#80868f)' }}>Total</div>
                    <div style={{ fontSize:20, fontWeight:700, color:'var(--text-primary,#282c32)', textAlign:'center' }}>0</div>
                  </div>
                </div>

                {/* Vacuum */}
                <div style={{ background:'var(--card-bg,#fff)', border:'1px solid var(--border,#c9cdd2)', borderRadius:6, padding:'8px 10px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text-secondary,#626872)', marginBottom:8, display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ color:'#3b82f6' }}>⊙</span> Vacuum
                  </div>
                  {[['Current Age','162M'],['Usable Age','38M']].map(([k,v])=>(
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:10 }}>
                      <span style={{ color:'var(--text-muted,#80868f)' }}>{k}</span>
                      <span style={{ color:'var(--text-primary,#282c32)', fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop:4 }}>
                    <div style={{ fontSize:9, color:'var(--text-muted,#80868f)', marginBottom:3 }}>Age Used</div>
                    <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary,#282c32)', marginBottom:3 }}>81.02%</div>
                    <div style={{ height:4, background:'var(--main-bg,#e3e7ea)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ width:'81%', height:'100%', background:'#f97316', borderRadius:2 }} />
                    </div>
                  </div>
                </div>

                {/* Replication */}
                <div style={{ background:'var(--card-bg,#fff)', border:'1px solid var(--border,#c9cdd2)', borderRadius:6, padding:'8px 10px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text-secondary,#626872)', marginBottom:8, display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ color:'#6b7280' }}>▪</span> Replication
                  </div>
                  {[['Primary',''],['Stand By',''],['Lag','']].map(([k,v])=>(
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:10 }}>
                      <span style={{ color:'var(--text-muted,#80868f)' }}>{k}</span>
                      <span style={{ color:'var(--text-primary,#282c32)', fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Check Point */}
                <div style={{ background:'var(--card-bg,#fff)', border:'1px solid var(--border,#c9cdd2)', borderRadius:6, padding:'8px 10px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text-secondary,#626872)', marginBottom:8, display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ color:'#22c55e' }}>✓</span> Check Point
                  </div>
                  {[['Backend Write','24%'],['Avg Write','9M'],['Avg Write Time','0s']].map(([k,v])=>(
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:10 }}>
                      <span style={{ color:'var(--text-muted,#80868f)' }}>{k}</span>
                      <span style={{ color:'var(--text-primary,#282c32)', fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* ── Admin Reference ── */}
            <div style={{ ...S.card, flex:1 }}>
              <div style={{ padding:'12px 16px', fontSize:14, fontWeight:700, color:'var(--text-primary,#282c32)', borderBottom:'1px solid var(--border,#c9cdd2)' }}>Admin Reference</div>

              {/* Vacuum — 기본 열림 */}
              <div style={{ border:'1px solid var(--border,#c9cdd2)', margin:12, borderRadius:6, overflow:'hidden' }}>
                <button onClick={() => toggleAdmin('vacuum')} style={{ width:'100%', background: adminOpen.vacuum ? 'var(--card-bg,#fff)' : 'var(--grid-header-bg,#edf0f2)', border:'none', cursor:'pointer', padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', color:'var(--text-primary,#282c32)', fontSize:12, fontWeight:700 }}>
                  <span>Vacuum</span>
                  <span style={{ fontSize:12, color:'var(--text-muted,#80868f)', transition:'transform .2s', display:'inline-block', transform: adminOpen.vacuum ? 'rotate(180deg)' : 'none' }}>∨</span>
                </button>
                {adminOpen.vacuum && (
                  <div style={{ padding:'10px 12px', display:'flex', gap:8 }}>
                    {/* 좌: Top Dead Tuple for Object bar */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:10, color:'var(--text-muted,#80868f)', marginBottom:6 }}>Top Dead Tuple for Object</div>
                      <ReactECharts option={deadTupleOpt([
                        { name:'ora_s...', val:50 },
                        { name:'ora_s...', val:8  },
                        { name:'ora_d...', val:4  },
                        { name:'ora_d...', val:2  },
                        { name:'ora_d...', val:1  },
                      ])} style={{ height:130 }} opts={{ renderer:'svg' }} />
                    </div>
                    {/* 우: Top Vacuuming Process bar (빈 상태) */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:10, color:'var(--text-muted,#80868f)', marginBottom:6 }}>Top Vacuuming Process (sec)</div>
                      <ReactECharts option={deadTupleOpt([])} style={{ height:130 }} opts={{ renderer:'svg' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Information */}
              <div style={{ border:'1px solid var(--border,#c9cdd2)', margin:'0 12px 12px', borderRadius:6, overflow:'hidden' }}>
                <button onClick={() => toggleAdmin('additional')} style={{ width:'100%', background: adminOpen.additional ? 'var(--card-bg,#fff)' : 'var(--grid-header-bg,#edf0f2)', border:'none', cursor:'pointer', padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', color:'var(--text-primary,#282c32)', fontSize:12, fontWeight:700 }}>
                  <span>Additional Information</span>
                  <span style={{ fontSize:12, color:'var(--text-muted,#80868f)', display:'inline-block', transform: adminOpen.additional ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}>∨</span>
                </button>
                {adminOpen.additional && (
                  <div style={{ padding:'8px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:11 }}>
                    {[['PG Version','15.3'],['Max Connections','200'],['Shared Buffers','1024 MB'],['WAL Level','replica'],['Archive Mode','on'],['Autovacuum','on']].map(([k,v])=>(
                      <div key={k} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid var(--border-light,#d8dbde)', paddingBottom:4 }}>
                        <span style={{ color:'var(--text-muted,#80868f)' }}>{k}</span>
                        <span style={{ color:'var(--text-primary,#282c32)', fontWeight:600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Alert Logs */}
              <div style={{ border:'1px solid var(--border,#c9cdd2)', margin:'0 12px 12px', borderRadius:6, overflow:'hidden' }}>
                <button onClick={() => toggleAdmin('alert')} style={{ width:'100%', background: adminOpen.alert ? 'var(--card-bg,#fff)' : 'var(--grid-header-bg,#edf0f2)', border:'none', cursor:'pointer', padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', color:'var(--text-primary,#282c32)', fontSize:12, fontWeight:700 }}>
                  <span>Alert Logs</span>
                  <span style={{ fontSize:12, color:'var(--text-muted,#80868f)', display:'inline-block', transform: adminOpen.alert ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}>∨</span>
                </button>
                {adminOpen.alert && (
                  <div style={{ padding:'6px 14px' }}>
                    {[
                      {level:'ERROR',msg:'could not serialize access due to concurrent update',time:'13:21:08'},
                      {level:'WARN', msg:'autovacuum: table "demo3.public.orders" needs analyze',time:'13:18:44'},
                    ].map((log, i) => (
                      <div key={i} style={{ display:'flex', gap:8, padding:'4px 0', borderBottom:'1px solid var(--border-light,#d8dbde)', alignItems:'flex-start' }}>
                        <span style={{ padding:'1px 5px', borderRadius:3, fontSize:9, fontWeight:700, background:log.level==='ERROR'?'#fee2e2':'#fef9c3', color:log.level==='ERROR'?'#dc2626':'#a16207', flexShrink:0 }}>{log.level}</span>
                        <span style={{ fontSize:10, color:'var(--text-secondary,#626872)', flex:1, lineHeight:1.4 }}>{log.msg}</span>
                        <span style={{ fontSize:9, color:'var(--text-muted,#80868f)', flexShrink:0 }}>{log.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ══ RIGHT — Real Time Monitor ══ */}
        <div style={S.right}>

          {/* Slow Query */}
          {/* ── Slow Query (scatter) ── */}
          <div style={{ ...S.card, flexShrink:0 }}>
            <div style={{ ...S.hdr }}>
              <span>Slow Query</span>
              <span style={{ fontSize:9, color:'var(--text-muted,#80868f)', fontWeight:400 }}>Max Elapsed Count · Max Elapsed Duration(s)</span>
            </div>
            <div style={{ background:'var(--card-bg,#fff)', cursor:'pointer', position:'relative' }} onClick={() => setSqModal(true)}>
              <ReactECharts
                option={sqScatterOpt(SQ_DOTS)}
                style={{ height:sqPanelChartH }}
                opts={{ renderer:'svg' }}
                onEvents={{ click: () => setSqModal(true) }}
              />
              <div style={{ position:'absolute', bottom:8, right:8, fontSize:9, color:'#9fa5ae', pointerEvents:'none' }}>click to detail</div>
            </div>
            {/* 리사이즈 핸들 */}
            <div
              onMouseDown={e => { e.stopPropagation(); startResize(e, sqPanelChartH, setSqPanelChartH) }}
              style={{ height:5, cursor:'s-resize', background:'transparent', borderBottom:'2px solid var(--border,#c9cdd2)', transition:'background .15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background='#c9cdd2'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background='transparent'}
              title="드래그하여 차트 높이 조절"
            />
          </div>

          <div style={S.hdr}><span>Real Time Monitor</span></div>

          {rtSelected.map((metricId, slotIdx) => {
            const metric    = SV_RT_METRIC_POOL.find(m => m.id === metricId) ?? SV_RT_METRIC_POOL[0]
            const slideOpen = rtSlideOpen === slotIdx
            return (
              <div key={slotIdx} style={{ ...S.card, flex: 1, minHeight: 80, position: 'relative', overflow: 'hidden' }}>
                <div style={{ ...S.hdr }}>
                  <span style={{ flex: 1, fontSize: 10 }}>{metric.label} ({metric.unit})</span>
                  <button
                    onClick={e => { e.stopPropagation(); setRtSlideOpen(slideOpen ? null : slotIdx) }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted,#80868f)', cursor: 'pointer', padding: '0 4px', fontSize: 15, lineHeight: 1, letterSpacing: 1 }}
                  >···</button>
                </div>
                <div style={{ background: 'var(--card-bg,#fff)' }}>
                  <SVRTLineChart metric={metric} height={80} />
                </div>
                {slideOpen && (
                  <>
                    <div onClick={() => setRtSlideOpen(null)} style={{ position: 'absolute', inset: 0, zIndex: 10 }} />
                    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 220, background: '#fff', boxShadow: '-3px 0 12px rgba(0,0,0,0.12)', zIndex: 20, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border,#c9cdd2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: 'var(--grid-header-bg,#edf0f2)' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary,#282c32)' }}>지표 변경</span>
                        <button onClick={() => setRtSlideOpen(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--text-muted,#80868f)', lineHeight: 1 }}>×</button>
                      </div>
                      <div style={{ flex: 1, overflowY: 'auto' }}>
                        {SV_RT_METRIC_POOL.map(m => {
                          const isSelected = m.id === metricId
                          return (
                            <div
                              key={m.id}
                              onClick={() => { setRtSelected(prev => prev.map((id, i) => i === slotIdx ? m.id : id)); setRtSlideOpen(null) }}
                              style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light,#d8dbde)', background: isSelected ? '#eff6ff' : 'transparent', fontSize: 11, color: isSelected ? '#3b82f6' : 'var(--text-secondary,#626872)', fontWeight: isSelected ? 600 : 400 }}
                              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--grid-header-bg,#edf0f2)' }}
                              onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                            >
                              <span>{m.label}</span>
                              <span style={{ fontSize: 10, color: 'var(--text-muted,#80868f)' }}>({m.unit})</span>
                              {isSelected && <span style={{ color: '#3b82f6', fontSize: 13, marginLeft: 4 }}>✓</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── BOTTOM SLIDE PANEL ── */}
      <div style={{ position:'fixed', bottom:0, left:'var(--sidebar-width,220px)', right:0, background:'var(--card-bg,#fff)', borderTop:'2px solid var(--border,#c9cdd2)', zIndex:100, height:bottomOpen ? 292 : 32, overflow:'hidden', transition:'height .3s cubic-bezier(.4,0,.2,1)' }}>

        {/* ── Session Tab 토글 바 (항상 표시, 유일한 토글) ── */}
        <div
          onClick={() => setBottomOpen(p => !p)}
          style={{ height:32, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--grid-header-bg,#edf0f2)', cursor:'pointer', userSelect:'none', gap:6, borderBottom:'1px solid var(--border,#c9cdd2)' }}
        >
          <span style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary,#626872)', letterSpacing:0.3 }}>Session Tab</span>
          <span style={{ fontSize:9, color:'var(--text-muted,#80868f)', lineHeight:1, display:'inline-block', transform: bottomOpen ? 'rotate(180deg)' : 'none', transition:'transform .3s' }}>▲</span>
        </div>

        {/* ── 탭 선택 바 (열렸을 때만 의미 있음) ── */}
        <div style={{ height:32, display:'flex', alignItems:'center', borderBottom:'1px solid var(--border,#c9cdd2)', background:'var(--card-bg,#fff)', gap:0 }}>
          {([['active','Active Backends'],['lock','Lock Tree']] as const).map(([k,label])=>(
            <button key={k}
              onClick={e => { e.stopPropagation(); setBottomTab(k) }}
              style={{ height:'100%', padding:'0 18px', border:'none', borderRight:'1px solid var(--border,#c9cdd2)', background:bottomTab===k ? 'var(--card-bg,#fff)' : 'var(--grid-header-bg,#edf0f2)', color:bottomTab===k ? 'var(--text-primary,#282c32)' : 'var(--text-muted,#80868f)', fontSize:11, fontWeight:bottomTab===k ? 700 : 400, cursor:'pointer', borderBottom: bottomTab===k ? '2px solid #3b82f6' : '2px solid transparent' }}
            >{label}</button>
          ))}
          <div style={{ flex:1 }} />
          {bottomTab==='active' && (
            <div style={{ display:'flex', gap:10, paddingRight:16, fontSize:10 }}>
              <span style={{ color:'#22c55e' }}>Active: {ACTIVE_BACKENDS.length}</span>
              <span style={{ color:'#f59e0b' }}>Wait: 1</span>
            </div>
          )}
        </div>

        {/* Active Backends */}
        {bottomOpen && bottomTab==='active' && (
          <div style={{ height:228, overflowY:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr style={{ background:'var(--grid-header-bg,#edf0f2)', position:'sticky', top:0 }}>
                  {['PID','User Name','Database Name','App Name','Client Address','Client Host Name','Backend Start','Elapsed Time (sec)'].map(h=>(
                    <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontWeight:600, color:'var(--text-muted,#80868f)', whiteSpace:'nowrap', borderBottom:'1px solid var(--border,#c9cdd2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ACTIVE_BACKENDS.map(s => (
                  <tr key={s.pid} style={{ borderBottom:'1px solid var(--border-light,#d8dbde)', cursor:'pointer' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--grid-header-bg,#edf0f2)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
                  >
                    <td style={{ padding:'5px 10px', color:'#3b82f6', fontWeight:600 }}>{s.pid}</td>
                    <td style={{ padding:'5px 10px', color:'var(--text-secondary,#626872)' }}>{s.userName}</td>
                    <td style={{ padding:'5px 10px', color:'var(--text-secondary,#626872)' }}>{s.dbName}</td>
                    <td style={{ padding:'5px 10px', color:'var(--text-muted,#80868f)' }}>{s.appName}</td>
                    <td style={{ padding:'5px 10px', color:'var(--text-muted,#80868f)', fontVariantNumeric:'tabular-nums' }}>{s.clientAddr}</td>
                    <td style={{ padding:'5px 10px', color:'var(--text-muted,#80868f)' }}>{s.clientHost}</td>
                    <td style={{ padding:'5px 10px', color:'var(--text-muted,#80868f)', whiteSpace:'nowrap' }}>{s.backendStart}</td>
                    <td style={{ padding:'5px 10px', color:s.elapsed>5?'#ef4444':s.elapsed>1?'#f59e0b':'var(--text-primary,#282c32)', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{s.elapsed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Lock Tree */}
        {bottomOpen && bottomTab==='lock' && (
          <div style={{ height:228, overflowY:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr style={{ background:'var(--grid-header-bg,#edf0f2)', position:'sticky', top:0 }}>
                  {['Database Name','PID','Lock Status','Holder PID','User Name'].map(h=>(
                    <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontWeight:600, color:'var(--text-muted,#80868f)', whiteSpace:'nowrap', borderBottom:'1px solid var(--border,#c9cdd2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LOCK_TREE.map((row, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid var(--border-light,#d8dbde)', cursor:'pointer' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--grid-header-bg,#edf0f2)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
                  >
                    <td style={{ padding:'5px 10px', color:'var(--text-secondary,#626872)' }}>{row.dbName}</td>
                    <td style={{ padding:'5px 10px', color:'#3b82f6', fontWeight:600 }}>{row.pid}</td>
                    <td style={{ padding:'5px 10px' }}>
                      <span style={{ padding:'2px 6px', borderRadius:3, fontSize:10, fontWeight:600, background:row.lockStatus==='waiting'?'#fee2e2':'#dcfce7', color:row.lockStatus==='waiting'?'#dc2626':'#16a34a' }}>{row.lockStatus}</span>
                    </td>
                    <td style={{ padding:'5px 10px', color:row.holderPid?'#f59e0b':'var(--text-muted,#80868f)', fontWeight:row.holderPid?600:400 }}>{row.holderPid ?? '-'}</td>
                    <td style={{ padding:'5px 10px', color:'var(--text-secondary,#626872)' }}>{row.userName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SLOT MODAL ── */}
      {slotModal && (
        <>
          <div onClick={() => setSlotModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:200 }} />
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:201, background:'#fff', borderRadius:8, boxShadow:'0 8px 32px rgba(0,0,0,.2)', width:560, overflow:'hidden' }}>
            <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border,#c9cdd2)', background:'var(--grid-header-bg,#edf0f2)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:12, fontWeight:700, color:'var(--text-primary,#282c32)' }}>{slotModal.title}</span>
              <button onClick={() => setSlotModal(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--text-muted,#80868f)', lineHeight:1 }}>×</button>
            </div>
            <div style={{ padding:'12px 16px' }}>
              <div style={{ fontSize:10, color:'var(--text-muted,#80868f)', marginBottom:4 }}>
                <span style={{ color:slotModal.color, fontWeight:700 }}>■</span> AVG &nbsp;&nbsp; <span style={{ color:'#22c55e', fontWeight:700 }}>■</span> MAX
              </div>
              <ReactECharts option={modalLineOpt(slotModal.color)} style={{ height:180 }} opts={{ renderer:'svg' }} />
            </div>
            <div style={{ borderTop:'1px solid var(--border,#c9cdd2)', padding:'8px 16px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted,#80868f)', marginBottom:6 }}>Vacuum</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10 }}>
                <thead><tr style={{ background:'var(--grid-header-bg,#edf0f2)' }}>{['Table','Type','Phase','Duration'].map(h=><th key={h} style={{ padding:'4px 8px', textAlign:'left', color:'var(--text-muted,#80868f)', fontWeight:600 }}>{h}</th>)}</tr></thead>
                <tbody>{VACUUM_ROWS.map(row=>(
                  <tr key={row[0]} style={{ borderTop:'1px solid var(--border-light,#d8dbde)' }}>
                    {row.map((c,ci)=><td key={ci} style={{ padding:'4px 8px', color:ci===3?'#f59e0b':'var(--text-secondary,#626872)', fontWeight:ci===3?600:400 }}>{c}</td>)}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          SQL ELAPSED LIST 팝업
      ══════════════════════════════════════════════════════ */}
      {sqModal && (
        <>
          {/* 배경 dim */}
          <div onClick={() => { setSqModal(false); setSqPidPanel(null) }} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:300 }} />

          {/* 팝업 박스 — 드래그 리사이즈 가능 */}
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:301, display:'flex', background:'#fff', borderRadius:8, boxShadow:'0 12px 48px rgba(0,0,0,.25)', overflow:'hidden', width: sqPidPanel ? Math.max(sqPopupW, 1100) : sqPopupW, height:sqPopupH, maxWidth:'96vw', maxHeight:'92vh' }}>

            {/* ── 왼쪽: SQL Elapsed List 본체 ── */}
            <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>

              {/* 헤더 */}
              <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border,#c9cdd2)', background:'var(--grid-header-bg,#edf0f2)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary,#282c32)' }}>
                  SQL Elapsed List ({SQ_TICK_TIMES[0]} ~ {SQ_TICK_TIMES[SQ_TICK_TIMES.length-1]})
                </span>
                <button onClick={() => { setSqModal(false); setSqPidPanel(null) }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'var(--text-muted,#80868f)', lineHeight:1 }}>×</button>
              </div>

              {/* 산점도 + 리사이즈 핸들 */}
              <div style={{ flexShrink:0 }}>
                <ReactECharts option={sqPopupScatterOpt(sqFiltered)} style={{ height:sqPopupChartH }} opts={{ renderer:'svg' }} />
                <div
                  onMouseDown={e => startResize(e, sqPopupChartH, setSqPopupChartH)}
                  style={{ height:5, cursor:'s-resize', background:'transparent', borderBottom:'2px solid var(--border,#c9cdd2)', transition:'background .15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background='#c9cdd2'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background='transparent'}
                  title="드래그하여 차트 높이 조절"
                />
              </div>

              {/* ── 필터 바 (database Active Session Tab 과 동일한 패턴) ── */}
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderBottom:'1px solid var(--border,#c9cdd2)', flexShrink:0, background:'#fafbfc' }}>
                <select
                  value={sqFilterMode}
                  onChange={e => setSqFilterMode(e.target.value as 'OR'|'AND')}
                  style={{ padding:'4px 8px', fontSize:12, border:'1px solid #d1d5db', borderRadius:4, background:'#fff', color:'#374151', cursor:'pointer', height:34, flexShrink:0 }}
                >
                  <option>OR</option>
                  <option>AND</option>
                </select>
                <FilterBar
                  filters={sqFilters}
                  onAdd={chip => setSqFilters(prev => [...prev, chip])}
                  onRemove={id => setSqFilters(prev => prev.filter(f => f.id !== id))}
                  onClear={() => setSqFilters([])}
                />
                <span style={{ fontSize:11, color:'#9fa5ae', flexShrink:0 }}>{sqFiltered.length}/{SQ_DOTS.length}</span>
              </div>

              {/* 테이블 */}
              <div style={{ flex:1, overflowY:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                  <thead>
                    <tr style={{ background:'var(--grid-header-bg,#edf0f2)', position:'sticky', top:0 }}>
                      {['Instance Name','PID','User Name','Database Name','App Name','Client Address','Client Host Name','Elapsed Time (sec)','SQL Text'].map(h=>(
                        <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontWeight:600, color:'var(--text-muted,#80868f)', whiteSpace:'nowrap', borderBottom:'1px solid var(--border,#c9cdd2)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sqFiltered.length === 0 ? (
                      <tr><td colSpan={9} style={{ padding:'24px', textAlign:'center', color:'#9fa5ae', fontSize:12 }}>필터 조건에 맞는 데이터가 없습니다.</td></tr>
                    ) : sqFiltered.map((d,i)=>(
                      <tr key={i}
                        style={{ borderBottom:'1px solid var(--border-light,#d8dbde)', background: sqPidPanel===d.pid ? '#eff6ff' : 'transparent' }}
                        onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background = sqPidPanel===d.pid ? '#eff6ff' : 'var(--grid-header-bg,#edf0f2)'}
                        onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background = sqPidPanel===d.pid ? '#eff6ff' : 'transparent'}
                      >
                        <td style={{ padding:'5px 10px', color:'var(--text-secondary,#626872)' }}>207 PG 15</td>
                        <td style={{ padding:'5px 10px' }}>
                          <span onClick={() => setSqPidPanel(p => p===d.pid ? null : d.pid)} style={{ color:'#3b82f6', fontWeight:700, cursor:'pointer', textDecoration:'underline' }}>{d.pid}</span>
                        </td>
                        <td style={{ padding:'5px 10px', color:'var(--text-secondary,#626872)' }}>{d.userName}</td>
                        <td style={{ padding:'5px 10px', color:'var(--text-secondary,#626872)' }}>demo3</td>
                        <td style={{ padding:'5px 10px', color:'var(--text-muted,#80868f)' }}>{d.appName}</td>
                        <td style={{ padding:'5px 10px', color:'var(--text-muted,#80868f)', fontVariantNumeric:'tabular-nums' }}>{d.clientAddr}</td>
                        <td style={{ padding:'5px 10px', color:'var(--text-muted,#80868f)' }}>{d.clientHost}</td>
                        <td style={{ padding:'5px 10px', fontWeight:700, color: d.elapsed>40?'#ef4444':d.elapsed>20?'#f59e0b':'#16a34a', fontVariantNumeric:'tabular-nums' }}>{d.elapsed.toFixed(3)}</td>
                        <td style={{ padding:'5px 10px', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          <span onClick={() => setSqlTextPopup(d.sqlText)} style={{ color:'#3b82f6', cursor:'pointer', textDecoration:'underline' }}>{d.sqlText}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── 우측: PID 세션 정보 패널 (슬라이드) ── */}
            {sqPidPanel !== null && (() => {
              const session = ACTIVE_BACKENDS.find(s => s.pid === sqPidPanel) ?? {
                pid: sqPidPanel, userName: SQ_DOTS.find(d=>d.pid===sqPidPanel)?.userName ?? '-',
                dbName:'demo3', appName: SQ_DOTS.find(d=>d.pid===sqPidPanel)?.appName ?? '-',
                clientAddr: SQ_DOTS.find(d=>d.pid===sqPidPanel)?.clientAddr ?? '-',
                clientHost: SQ_DOTS.find(d=>d.pid===sqPidPanel)?.clientHost ?? '-',
                backendStart:'2026-04-17 08:00:00', elapsed: SQ_DOTS.find(d=>d.pid===sqPidPanel)?.elapsed ?? 0
              }
              return (
                <div style={{ width:380, flexShrink:0, borderLeft:'2px solid var(--border,#c9cdd2)', display:'flex', flexDirection:'column', overflow:'hidden', background:'#fafbfc' }}>
                  {/* 패널 헤더 */}
                  <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border,#c9cdd2)', background:'var(--grid-header-bg,#edf0f2)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'var(--text-primary,#282c32)' }}>Session Info — PID {sqPidPanel}</span>
                    <button onClick={() => setSqPidPanel(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--text-muted,#80868f)' }}>×</button>
                  </div>
                  {/* 세션 정보 */}
                  <div style={{ padding:'12px 14px', overflowY:'auto', flex:1 }}>
                    {[
                      ['PID',             String(session.pid)],
                      ['User Name',       session.userName],
                      ['Database Name',   session.dbName],
                      ['App Name',        session.appName],
                      ['Client Address',  session.clientAddr],
                      ['Client Host',     session.clientHost],
                      ['Backend Start',   session.backendStart],
                      ['Elapsed (sec)',   String(session.elapsed)],
                    ].map(([k,v])=>(
                      <div key={k} style={{ display:'flex', borderBottom:'1px solid var(--border-light,#d8dbde)', padding:'8px 0' }}>
                        <span style={{ width:120, flexShrink:0, fontSize:11, color:'var(--text-muted,#80868f)', fontWeight:600 }}>{k}</span>
                        <span style={{ fontSize:11, color:'var(--text-primary,#282c32)', wordBreak:'break-all' }}>{v}</span>
                      </div>
                    ))}

                    {/* 해당 PID의 Slow Query 목록 */}
                    <div style={{ marginTop:16 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-secondary,#626872)', marginBottom:8 }}>Slow Queries (this PID)</div>
                      {SQ_DOTS.filter(d=>d.pid===sqPidPanel).map((d,i)=>(
                        <div key={i} style={{ background:'#fff', border:'1px solid var(--border,#c9cdd2)', borderRadius:6, padding:'8px 10px', marginBottom:6 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                            <span style={{ fontSize:10, color:'var(--text-muted,#80868f)' }}>{d.time}</span>
                            <span style={{ fontSize:11, fontWeight:700, color: d.elapsed>40?'#ef4444':'#f59e0b' }}>{d.elapsed.toFixed(3)}s</span>
                          </div>
                          <div
                            style={{ fontSize:10, color:'#3b82f6', cursor:'pointer', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                            onClick={() => setSqlTextPopup(d.sqlText)}
                          >{d.sqlText}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ── 팝업 리사이즈 핸들 ── */}
            {/* 우측 변 */}
            <div onMouseDown={e => startPopupResize(e, 'e')} style={{ position:'absolute', top:0, right:0, width:6, height:'100%', cursor:'ew-resize', zIndex:10 }} />
            {/* 하단 변 */}
            <div onMouseDown={e => startPopupResize(e, 's')} style={{ position:'absolute', bottom:0, left:0, width:'100%', height:6, cursor:'s-resize', zIndex:10 }} />
            {/* 우하 모서리 */}
            <div onMouseDown={e => startPopupResize(e, 'se')} style={{ position:'absolute', bottom:0, right:0, width:14, height:14, cursor:'se-resize', zIndex:11, background:'linear-gradient(135deg, transparent 50%, #c9cdd2 50%)', borderRadius:'0 0 8px 0' }} />
          </div>
        </>
      )}

      {/* SQL Text 미니 팝업 */}
      {sqlTextPopup && (
        <>
          <div onClick={() => setSqlTextPopup(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.3)', zIndex:400 }} />
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:401, background:'#fff', borderRadius:8, boxShadow:'0 8px 32px rgba(0,0,0,.2)', width:600, overflow:'hidden' }}>
            <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border,#c9cdd2)', background:'var(--grid-header-bg,#edf0f2)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:12, fontWeight:700, color:'var(--text-primary,#282c32)' }}>SQL Text</span>
              <button onClick={() => setSqlTextPopup(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--text-muted,#80868f)' }}>×</button>
            </div>
            <div style={{ padding:'16px', maxHeight:300, overflowY:'auto' }}>
              <pre style={{ margin:0, fontSize:12, color:'var(--text-primary,#282c32)', background:'#f6f8fa', padding:'12px 14px', borderRadius:6, border:'1px solid var(--border,#c9cdd2)', whiteSpace:'pre-wrap', wordBreak:'break-all', lineHeight:1.7, fontFamily:'Consolas, monospace' }}>{sqlTextPopup}</pre>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
