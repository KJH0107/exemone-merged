'use client'
import { useState, useEffect, useRef } from 'react'
import ReactECharts from 'echarts-for-react'

/* ══════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════ */
const INSTANCES = [
  { id: 'i1', name: '207 PG 15',      short: '207 PG 15',    color: '#3b82f6' },
  { id: 'i2', name: '233 pg 17.6',    short: '233 pg 17.6',  color: '#10b981' },
  { id: 'i3', name: '239 pg 15 -sec', short: '239 pg 15 -s', color: '#f59e0b' },
  { id: 'i4', name: '239 pg 15 -pri', short: '239 pg 15 -p', color: '#8b5cf6' },
  { id: 'i5', name: 'MFT DEM...',     short: 'MFT DEM',      color: '#ec4899' },
]

const RANK_METRICS = [
  { id: 'vacuum',     label: 'Vacuum Usage (%)',        unit: '%',  vals: [81, 5.1, 0, 0],              instances: [0,1,2,3] },
  { id: 'temp',       label: 'Temp Usage (Size)',        unit: 'GB', vals: [13.6, 8.7, 145.0, 137.6],    instances: [0,1,2,3] },
  { id: 'filesystem', label: 'Filesystem Usage (Size)',  unit: 'GB', vals: [13.2, 2.8, 127.6, 137.6],    instances: [0,1,2,3] },
  { id: 'queryio',    label: 'Query IO (%)',             unit: '%',  vals: [98.6, 99.9, 99.9, 99.9],     instances: [1,2,0,3] },
  { id: 'txtime',     label: 'Transaction Time (Time)',  unit: 'ms', vals: [0, 0, 0, 0],                 instances: [1,0,2,3] },
  { id: 'alert',      label: 'Alert',                   unit: '',   vals: [0, 0, 3],                     instances: [0,1,2], isAlert: true },
]



// Overview: 인스턴스별 CPU/Memory/Tps/RowsHit 값
const OV_DATA = [
  { cpu: 1.8,  mem: 25.0, tps: 5,  rowsHit: 98.2 },
  { cpu: 39.9, mem: 63.8, tps: 12, rowsHit: 99.8 },
  { cpu: 41.5, mem: 63.8, tps: 1,  rowsHit: 75.0 },
  { cpu: 0,    mem: 0,    tps: 2,  rowsHit: 87.5 },
  { cpu: 0,    mem: 0,    tps: 0,  rowsHit: 0    },
]

// 랭크 라인차트: 1분 간격 10포인트 = 10분
function makeRankTimes() {
  const now = Date.now()
  return Array.from({ length: 10 }, (_, i) => {
    const t = new Date(now - (9 - i) * 60000)
    return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`
  })
}
// RT 메트릭: 5초 간격 120포인트 = 10분
function makeRTTimes() {
  const now = Date.now()
  return Array.from({ length: 120 }, (_, i) => {
    const t = new Date(now - (119 - i) * 5000)
    return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`
  })
}
function makeSeriesData(base: number, range: number, count = 10) {
  return Array.from({ length: count }, () => Math.max(0, base + (Math.random() - 0.5) * range * 2))
}

const RANK_TIMES = makeRankTimes()
const RT_TIMES   = makeRTTimes()
const TIMES = RANK_TIMES // 하위 호환


const SESSION_TYPE_DATA = INSTANCES.map(() => ({
  lock:   Math.floor(Math.random() * 2),
  long:   Math.floor(Math.random() * 2),
  active: Math.floor(Math.random() * 4) + 1,
}))

// RT 지표 풀 — 8개 선택 가능한 지표
const RT_METRIC_POOL = [
  { id: 'blks_hit',    label: 'Blks Hit',          unit: 'count',   series: INSTANCES.map(i => ({ name: i.name, color: i.color, data: makeSeriesData(35000, 8000, 120) })) },
  { id: 'blks_read',   label: 'Blks Read',          unit: 'blocks',  series: INSTANCES.map(i => ({ name: i.name, color: i.color, data: makeSeriesData(15, 10,   120) })) },
  { id: 'rows_hit',    label: 'Rows Hit Ratio',     unit: '%',       series: INSTANCES.map(i => ({ name: i.name, color: i.color, data: makeSeriesData(98, 2,    120) })) },
  { id: 'tps',         label: 'TPS',                unit: 'count/s', series: INSTANCES.map(i => ({ name: i.name, color: i.color, data: makeSeriesData(320, 80,  120) })) },
  { id: 'tup_ins',     label: 'Tup Inserted',       unit: 'count',   series: INSTANCES.map(i => ({ name: i.name, color: i.color, data: makeSeriesData(500, 200, 120) })) },
  { id: 'tup_upd',     label: 'Tup Updated',        unit: 'count',   series: INSTANCES.map(i => ({ name: i.name, color: i.color, data: makeSeriesData(200, 100, 120) })) },
  { id: 'tup_del',     label: 'Tup Deleted',        unit: 'count',   series: INSTANCES.map(i => ({ name: i.name, color: i.color, data: makeSeriesData(50,  30,  120) })) },
  { id: 'active_sess', label: 'Active Sessions',    unit: 'count',   series: INSTANCES.map(i => ({ name: i.name, color: i.color, data: makeSeriesData(8,   4,   120) })) },
]
// 기본 슬롯 3개
const RT_METRICS = RT_METRIC_POOL.slice(0, 3)

// Slow Query mock (멀티뷰 — 인스턴스별 점 색상 구분)
const SQ_PIDS    = [31842, 31801, 31755, 31710, 31698, 31620]
const SQ_USERS   = ['app_user','analytics','dba','app_user','analytics','app_user']
const SQ_APPS    = ['node-postgres','psql','pgAdmin 4','node-postgres','psql','node-postgres']
const SQ_SQL_LIST = [
  'SELECT pg_sleep(50 + random() * 10)',
  "SELECT * FROM order_history WHERE created_at > NOW() - INTERVAL '30 days'",
  'UPDATE sessions SET last_active = NOW() WHERE session_id = $1',
  'SELECT p.*, SUM(oi.quantity * oi.price) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.id',
  "DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days'",
]
function genSQTimes(n: number) {
  const now = Date.now()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now - i * 15 * 1000)
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`
  }).reverse()
}
interface MvSQDot { time:string; elapsed:number; pid:number; instIdx:number; userName:string; appName:string; clientAddr:string; clientHost:string; sqlText:string }
const SQ_TICK_TIMES = genSQTimes(20)
const MV_SQ_DOTS: MvSQDot[] = Array.from({ length: 28 }, (_, i) => {
  const pidIdx  = i % SQ_PIDS.length
  const instIdx = Math.floor(Math.random() * INSTANCES.length)
  return {
    time:       SQ_TICK_TIMES[Math.floor(Math.random() * SQ_TICK_TIMES.length)],
    elapsed:    +(Math.random() * 60 + 8).toFixed(3),
    pid:        SQ_PIDS[pidIdx],
    instIdx,
    userName:   SQ_USERS[pidIdx],
    appName:    SQ_APPS[pidIdx],
    clientAddr: `10.10.1.${5 + instIdx}`,
    clientHost: `app-server-0${instIdx + 1}`,
    sqlText:    SQ_SQL_LIST[i % SQ_SQL_LIST.length],
  }
})

// FilterBar (싱글뷰와 동일한 패턴)
interface MvFilterChip { id:string; field:string; fieldKey:string; operator:string; value:string }
const MV_SQ_OPERATORS = ['==','!=','like','not like']
const MV_SQ_FIELDS = [
  { key:'instName',   label:'Instance Name', isDefault:true  },
  { key:'pid',        label:'PID',           isDefault:true  },
  { key:'sqlText',    label:'SQL Text',      isDefault:true  },
  { key:'userName',   label:'User Name',     isDefault:false },
  { key:'appName',    label:'App Name',      isDefault:false },
  { key:'clientAddr', label:'Client Addr',   isDefault:false },
  { key:'elapsed',    label:'Elapsed Time',  isDefault:false },
]
type MvFilterStep = 'idle'|'field'|'operator'|'value'
function MvFilterBar({ filters, onAdd, onRemove, onClear }: { filters:MvFilterChip[]; onAdd:(c:MvFilterChip)=>void; onRemove:(id:string)=>void; onClear:()=>void }) {
  const [step, setStep]                 = useState<MvFilterStep>('idle')
  const [pendingField, setPendingField] = useState<typeof MV_SQ_FIELDS[0]|null>(null)
  const [pendingOp, setPendingOp]       = useState('')
  const [inputVal, setInputVal]         = useState('')
  const [navIdx, setNavIdx]             = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const valueRef     = useRef<HTMLInputElement>(null)
  const dropItems = step==='field' ? MV_SQ_FIELDS : step==='operator' ? MV_SQ_OPERATORS.map(o=>({key:o,label:o,isDefault:false})) : []
  useEffect(()=>{
    if(step==='idle') return
    const h=(e:MouseEvent)=>{if(!containerRef.current?.contains(e.target as Node))reset()}
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h)
  },[step])
  const reset=()=>{setStep('idle');setPendingField(null);setPendingOp('');setInputVal('');setNavIdx(0)}
  const selectField=(f:typeof MV_SQ_FIELDS[0])=>{setPendingField(f);setStep('operator');setNavIdx(0)}
  const selectOp=(op:string)=>{setPendingOp(op);setStep('value');setTimeout(()=>valueRef.current?.focus(),10)}
  const commit=()=>{
    if(!pendingField||!pendingOp||!inputVal.trim()) return
    onAdd({id:Date.now().toString(),field:pendingField.label,fieldKey:pendingField.key,operator:pendingOp,value:inputVal.trim()})
    reset()
  }
  const isDropOpen=step==='field'||step==='operator'
  const chipSt:React.CSSProperties={display:'inline-flex',alignItems:'center',gap:4,background:'#1e3a6e',color:'#7eb3ff',borderRadius:3,padding:'2px 8px',fontSize:12,flexShrink:0}
  return (
    <div ref={containerRef} style={{position:'relative',flex:1}}>
      <div onClick={()=>{if(step==='idle'){setStep('field');setNavIdx(0)}}}
        onKeyDown={e=>{
          if(isDropOpen){
            if(e.key==='ArrowDown'){e.preventDefault();setNavIdx(i=>Math.min(i+1,dropItems.length-1))}
            if(e.key==='ArrowUp'){e.preventDefault();setNavIdx(i=>Math.max(i-1,0))}
            if(e.key==='Enter'){step==='field'?selectField(MV_SQ_FIELDS[navIdx]):selectOp(MV_SQ_OPERATORS[navIdx])}
            if(e.key==='Escape')reset()
          }
        }}
        tabIndex={isDropOpen?0:-1}
        style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:6,minHeight:34,padding:'4px 8px',cursor:step==='idle'?'text':'default',border:`1px solid ${isDropOpen||step==='value'?'#006DFF':'#c9cdd2'}`,borderRadius:isDropOpen?'4px 4px 0 0':4,background:'#fff',outline:'none'}}
      >
        {filters.map(f=>(
          <span key={f.id} style={chipSt}>
            <span style={{color:'#93c5fd'}}>{f.field}</span>
            <span style={{color:'#7dd3fc',fontSize:11}}> {f.operator} </span>
            <b style={{color:'#fff'}}>{f.value}</b>
            <button onClick={e=>{e.stopPropagation();onRemove(f.id)}} style={{background:'none',border:'none',cursor:'pointer',color:'#7eb3ff',fontSize:13,padding:0,lineHeight:1,marginLeft:2}}>x</button>
          </span>
        ))}
        {pendingField&&(
          <span style={{...chipSt,background:'#1a2d50',color:'#93c5fd',border:'1px dashed #3b5998'}}>
            <span>{pendingField.label}</span>
            {pendingOp&&<span style={{color:'#7dd3fc',fontSize:11}}> {pendingOp}</span>}
            <button onClick={e=>{e.stopPropagation();reset()}} style={{background:'none',border:'none',cursor:'pointer',color:'#93c5fd',fontSize:13,padding:0,lineHeight:1}}>x</button>
          </span>
        )}
        {step==='value'&&(
          <input ref={valueRef} value={inputVal} onChange={e=>setInputVal(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();commit()}if(e.key==='Escape')reset()}}
            placeholder="Enter value and press Enter"
            style={{flex:1,minWidth:120,border:'none',outline:'none',fontSize:12,background:'transparent',color:'#282c32'}}
          />
        )}
        {step!=='value'&&<span style={{fontSize:14,color:step==='idle'?'#80868f':'#006DFF',lineHeight:1}}>|</span>}
        {(filters.length>0||step!=='idle')&&(
          <button onClick={e=>{e.stopPropagation();reset();onClear()}} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'#80868f',fontSize:18,padding:'0 4px',lineHeight:1}}>x</button>
        )}
      </div>
      {isDropOpen&&(
        <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:450,background:'#fff',border:'1px solid #006DFF',borderTop:'none',borderRadius:'0 0 6px 6px',boxShadow:'0 6px 20px rgba(0,0,0,.25)',maxHeight:260,display:'flex',flexDirection:'column'}}>
          <div style={{padding:'8px 14px',fontSize:12,fontWeight:700,color:'#111',borderBottom:'1px solid #f0f0f0',background:'#fafafa'}}>
            {step==='field'?'Filter Category':'Filter Inequality Sign'}
          </div>
          <div style={{flex:1,overflowY:'auto'}}>
            {dropItems.map((item,i)=>(
              <div key={item.key}
                onClick={()=>step==='field'?selectField(MV_SQ_FIELDS[i]):selectOp(MV_SQ_OPERATORS[i])}
                onMouseEnter={()=>setNavIdx(i)}
                style={{padding:'9px 16px',fontSize:13,cursor:'pointer',background:i===navIdx?'#eff6ff':'transparent',color:i===navIdx?'#1d4ed8':'#333',display:'flex',alignItems:'center',gap:8,borderBottom:'1px solid #f8f8f8'}}
              >
                {item.label}
                {item.isDefault&&<span style={{fontSize:11,background:'#3b82f6',color:'#fff',padding:'1px 8px',borderRadius:3,fontWeight:600}}>Default</span>}
              </div>
            ))}
          </div>
          <div style={{padding:'6px 14px',borderTop:'1px solid #f0f0f0',background:'#fafafa',display:'flex',gap:20,fontSize:11,color:'#999'}}>
            <span>↑↓ navigate</span><span>Enter select</span><span>Esc close</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── 공통 토큰 ── */
const C = {
  bg:       '#f8f9fa',
  surface:  '#ffffff',
  border:   '#e5e7eb',
  borderMd: '#d1d5db',
  text:     '#111827',
  textMd:   '#374151',
  textSm:   '#6b7280',
  active:   '#eff6ff',
  activeBd: '#3b82f6',
  axis:     '#9ca3af',
  split:    '#f3f4f6',
}

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════ */

// 인스턴스 듀얼바 행: [값][바→] | 인스턴스명 | Tps | RowsHit
function DualBarRow({ inst, cpuVal, memVal, tpsVal, rowsHitVal, highlighted }: {
  inst: typeof INSTANCES[0]; cpuVal: number; memVal: number; tpsVal: number; rowsHitVal: number; highlighted?: boolean
}) {
  const cpuPct = Math.min(100, cpuVal)
  const memPct = Math.min(100, memVal)
  const rowBg = highlighted ? '#fffbeb' : 'transparent'
  const instColor = highlighted ? '#d97706' : C.textSm
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: rowBg, borderRadius: 3, padding: '3px 0', gap: 6, minWidth: 0 }}>
      {/* 왼쪽: [값] [바→] 순서 */}
      <div style={{ flexShrink: 0 }}>
        {/* CPU */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
          <div style={{ width: 32, fontSize: 9, color: '#3b82f6', textAlign: 'right', flexShrink: 0 }}>
            {cpuVal.toFixed(1)}%
          </div>
          <div style={{ width: 56, height: 5, background: '#f3f4f6', borderRadius: 2, flexShrink: 0 }}>
            <div style={{ width: `${cpuPct}%`, height: '100%', background: '#3b82f6', borderRadius: 2 }} />
          </div>
        </div>
        {/* Memory */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 32, fontSize: 9, color: '#65a30d', textAlign: 'right', flexShrink: 0 }}>
            {memVal.toFixed(1)}%
          </div>
          <div style={{ width: 56, height: 5, background: '#f3f4f6', borderRadius: 2, flexShrink: 0 }}>
            <div style={{ width: `${memPct}%`, height: '100%', background: '#84cc16', borderRadius: 2 }} />
          </div>
        </div>
      </div>
      {/* 인스턴스명 (중앙, flex 1) */}
      <div style={{ flex: 1, fontSize: 10, color: instColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: highlighted ? 600 : 400, minWidth: 0 }}>
        {inst.short}
      </div>
      {/* 우측: Tps / Rows Hit 수치 */}
      <div style={{ flexShrink: 0, textAlign: 'right', fontSize: 9, lineHeight: '14px' }}>
        <div style={{ color: C.textMd }}>{tpsVal}</div>
        <div style={{ color: C.textSm }}>{rowsHitVal > 0 ? rowsHitVal.toFixed(1) + '%' : '0%'}</div>
      </div>
    </div>
  )
}

function RankCard({ metric, active, onClick }: { metric: typeof RANK_METRICS[0]; active: boolean; onClick: () => void }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const s: React.CSSProperties = {
    background: active ? C.active : C.surface,
    border: `1px solid ${active ? C.activeBd : C.border}`,
    borderRadius: 6, padding: '10px 12px', cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
  }
  if ((metric as any).isAlert) {
    return (
      <div onClick={onClick} style={s}>
        <div style={{ fontSize: 11, color: C.textSm, marginBottom: 8 }}>{metric.label}</div>
        <div style={{ display: 'flex', gap: 16 }}>
          {[['Critical','#ef4444'],[' Warning','#f97316'],['Total','#6b7280']].map(([lbl, clr], i) => (
            <div key={lbl}>
              <div style={{ fontSize: 10, color: clr }}>{lbl}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: clr }}>{metric.vals[i]}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div onClick={onClick} style={s}>
      <div style={{ fontSize: 11, color: active ? C.activeBd : C.textSm, marginBottom: 6 }}>{metric.label}</div>
      {metric.vals.map((v, i) => (
        <div
          key={i}
          style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 4px', borderRadius: 3, background: hoverIdx === i ? '#f0f7ff' : 'transparent', position: 'relative', gap: 4, minWidth: 0 }}
          onMouseEnter={() => setHoverIdx(i)}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <span style={{ color: C.textSm, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ color: C.activeBd, marginRight: 4 }}>{i + 1}</span>
            {INSTANCES[metric.instances[i]]?.short}
          </span>
          <span style={{ color: C.text, flexShrink: 0, whiteSpace: 'nowrap' }}>{v} {metric.unit}</span>
          {hoverIdx === i && (
            <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', background: '#1f2937', color: '#fff', fontSize: 10, padding: '4px 8px', borderRadius: 4, whiteSpace: 'nowrap', zIndex: 200, pointerEvents: 'none', marginBottom: 4 }}>
              {metric.label}: {v} {metric.unit}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function RankBarChart({ metric, mode, height = 160 }: { metric: typeof RANK_METRICS[0]; mode: 'rank' | 'ratio'; height?: number | string }) {
  const data = metric.vals.map((v, i) => ({
    name: INSTANCES[metric.instances[i]]?.name || '',
    value: v,
    color: INSTANCES[metric.instances[i]]?.color || '#3b82f6',
  })).sort((a, b) => b.value - a.value)
  const maxVal = Math.max(...data.map(d => d.value), 1)

  // Ratio 모드 → 테이블 그리드
  if (mode === 'ratio') {
    const total = data.reduce((s, d) => s + d.value, 0) || 1
    const ALPHA = ['a','b','c','d','e']
    return (
      <div style={{ height, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: `1px solid ${C.border}` }}>
              <th style={{ padding: '5px 8px', textAlign: 'center', color: C.textSm, fontWeight: 500, width: 28 }}></th>
              <th style={{ padding: '5px 8px', textAlign: 'left', color: C.textSm, fontWeight: 500 }}>Instance Name</th>
              <th style={{ padding: '5px 8px', textAlign: 'right', color: C.textSm, fontWeight: 500 }}>Value (%)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => {
              const pct = +((d.value / total) * 100).toFixed(1)
              return (
                <tr key={d.name} style={{ borderBottom: `1px solid ${C.split}` }}>
                  <td style={{ padding: '5px 8px', textAlign: 'center', color: d.color, fontWeight: 600 }}>{ALPHA[i]}</td>
                  <td style={{ padding: '5px 8px', color: C.textMd }}>
                    <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background: d.color, marginRight:6 }} />
                    {d.name}
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', color: C.text, fontWeight: 500 }}>{pct} %</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // Rank 모드 → 수평 바 차트
  const option = {
    backgroundColor: '#ffffff',
    tooltip: { trigger: 'axis', formatter: (params: any) => `<b>${metric.label}</b><br/>${params[0].name}: ${params[0].value} ${metric.unit}` },
    xAxis: { type: 'value', max: maxVal * 1.1 || 1, axisLabel: { color: C.axis, fontSize: 10 }, splitLine: { lineStyle: { color: C.split } } },
    yAxis: { type: 'category', data: data.map(d => d.name), axisLabel: { color: C.textSm, fontSize: 11 } },
    series: [{ type: 'bar', data: data.map(d => ({ value: d.value, itemStyle: { color: d.color } })), barMaxWidth: 20, label: { show: true, position: 'right', color: C.textMd, fontSize: 11, formatter: (p: any) => p.value + ' ' + metric.unit } }],
    grid: { left: 110, right: 70, top: 10, bottom: 20 },
  }
  return <ReactECharts option={option} style={{ height }} />
}

function RTLineChart({ metric, chartType, height = 100 }: { metric: typeof RT_METRICS[0]; chartType: string; height?: number | string }) {
  const option = {
    backgroundColor: '#ffffff',
    tooltip: { trigger: 'axis' },
    legend: { show: false },
    xAxis: { type: 'category', data: RT_TIMES, axisLabel: { color: C.axis, fontSize: 10, interval: 11, formatter: (v: string) => v.slice(0,5) }, axisLine: { lineStyle: { color: C.border } }, splitLine: { show: false } },
    yAxis: { type: 'value', axisLabel: { color: C.axis, fontSize: 10 }, splitLine: { lineStyle: { color: C.split } } },
    series: metric.series.map(s => ({
      name: s.name, type: chartType === 'Bar' ? 'bar' : 'line', data: s.data,
      lineStyle: { width: 1.5 }, itemStyle: { color: s.color },
      areaStyle: chartType === 'Area' ? { color: s.color, opacity: 0.12 } : undefined,
      symbol: 'none', smooth: false,
    })),
    grid: { left: 40, right: 10, top: 8, bottom: 24 },
  }
  return <ReactECharts option={option} style={{ height }} />
}

function mvSqScatterOpt(dots: MvSQDot[], bg = '#ffffff') {
  return {
    backgroundColor: bg,
    grid: { top:6, right:8, bottom:24, left:40 },
    xAxis: { type:'category', data: SQ_TICK_TIMES, axisLabel:{ color: C.axis, fontSize:8, interval: Math.floor(SQ_TICK_TIMES.length/4) }, axisTick:{ show:false }, axisLine:{ lineStyle:{ color: C.border } } },
    yAxis: { type:'value', name:'sec', nameTextStyle:{ color: C.axis, fontSize:8 }, axisLabel:{ color: C.axis, fontSize:8 }, splitLine:{ lineStyle:{ color: C.split, type:'dashed' } }, min:0 },
    legend: { show:false },
    series: INSTANCES.map((inst, iIdx) => ({
      name: inst.name,
      type: 'scatter',
      symbolSize: 7,
      data: dots.filter(d => d.instIdx === iIdx).map(d => [d.time, d.elapsed, d.pid, d.sqlText]),
      itemStyle: { color: inst.color, opacity: 0.85 },
    })),
    tooltip: { trigger:'item', formatter:(p: any) => `<b style="color:${INSTANCES[p.seriesIndex]?.color}">${INSTANCES[p.seriesIndex]?.short}</b><br/>PID: ${p.data[2]}<br/>Elapsed: ${(+p.data[1]).toFixed(3)}s` },
  }
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function MultiViewPage() {
  const [now, setNow] = useState('')
  const [activeRank, setActiveRank] = useState(0)
  const [rankMode, setRankMode] = useState<'rank' | 'ratio'>('rank')
  const [rtSelected, setRtSelected]   = useState(['blks_hit', 'blks_read', 'rows_hit'])
  const [rtSlideOpen, setRtSlideOpen] = useState<number|null>(null)
  const [sqModal, setSqModal]         = useState(false)
  const [sqPidPanel, setSqPidPanel]   = useState<number|null>(null)
  const [sqFilters, setSqFilters]     = useState<MvFilterChip[]>([])
  const [sqFilterMode, setSqFilterMode] = useState<'OR'|'AND'>('OR')
  const [sqPopupW, setSqPopupW]       = useState(960)
  const [sqPopupH, setSqPopupH]       = useState(620)
  const [sqPopupChartH, setSqPopupChartH] = useState(160)

  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleString('ko-KR', { hour12: false }))
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  const curMetric = RANK_METRICS[activeRank]

  // Slow Query 필터링
  const sqFiltered = sqFilters.length === 0 ? MV_SQ_DOTS : MV_SQ_DOTS.filter(d => {
    const checks = sqFilters.map(f => {
      const raw = f.fieldKey === 'instName' ? INSTANCES[d.instIdx]?.name ?? ''
                : f.fieldKey === 'pid'      ? String(d.pid)
                : f.fieldKey === 'sqlText'  ? d.sqlText
                : f.fieldKey === 'userName' ? d.userName
                : f.fieldKey === 'appName'  ? d.appName
                : f.fieldKey === 'clientAddr' ? d.clientAddr
                : f.fieldKey === 'elapsed'  ? String(d.elapsed)
                : ''
      const val = f.value.toLowerCase(); const src = raw.toLowerCase()
      if (f.operator === '==')       return src === val
      if (f.operator === '!=')       return src !== val
      if (f.operator === 'like')     return src.includes(val)
      if (f.operator === 'not like') return !src.includes(val)
      return true
    })
    return sqFilterMode === 'AND' ? checks.every(Boolean) : checks.some(Boolean)
  })

  // 팝업 리사이즈
  const startPopupResize = (e: React.MouseEvent, dir: 'e'|'s'|'se') => {
    e.preventDefault(); const sx=e.clientX, sy=e.clientY, sw=sqPopupW, sh=sqPopupH
    const onMove=(me: MouseEvent)=>{
      if(dir==='e'||dir==='se') setSqPopupW(Math.max(600, sw+(me.clientX-sx)))
      if(dir==='s'||dir==='se') setSqPopupH(Math.max(400, sh+(me.clientY-sy)))
    }
    const onUp=()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp)}
    window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp)
  }
  const startChartResize = (e: React.MouseEvent, cur: number, set: (n:number)=>void) => {
    e.preventDefault(); const sy=e.clientY, sc=cur
    const onMove=(me: MouseEvent)=>set(Math.max(80, sc+(me.clientY-sy)))
    const onUp=()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp)}
    window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp)
  }

  // CPU 기준 내림차순 정렬 (고정)
  const sortedInst = [...INSTANCES.map((_, i) => i)].sort((a, b) => OV_DATA[b].cpu - OV_DATA[a].cpu)

  const colHeader = (title: string): React.CSSProperties => ({
    padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
    fontWeight: 600, fontSize: 13, color: C.text, flexShrink: 0, background: C.surface,
  })

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, color: C.text, fontFamily: 'sans-serif', fontSize: 12, overflow: 'hidden' }}
      onClick={() => setRtSlideOpen(null)}
    >
      {/* ── Top Breadcrumb ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        <span style={{ color: C.activeBd, fontWeight: 600 }}>PostgreSQL</span>
        <span style={{ color: C.border }}>/</span>
        <span style={{ color: C.textMd }}>멀티 뷰 ▾</span>
        <span style={{ color: C.border }}>/</span>
        <span style={{ color: C.textSm }}>PG ▾</span>
        <div style={{ flex: 1 }} />
        <span style={{ padding: '2px 8px', background: '#dcfce7', color: '#16a34a', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>LIVE</span>
        <span style={{ color: C.textSm, fontSize: 11 }} suppressHydrationWarning>{now}</span>
        <button style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textSm, borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>⏸</button>
      </div>

      {/* ── 3-Column Body: 외부 컨테이너가 크기 정의, 각 패널이 꽉 채움 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr', flex: 1, overflow: 'hidden', gap: 8, padding: 8, background: C.bg }}>

        {/* ═══ LEFT: Overview ═══ */}
        <div style={{ background: C.surface, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, borderRadius: 6 }}>
          {/* 헤더 */}
          <div style={colHeader('Overview')} />

          {/* CPU/Memory 범례 + Tps/Rows Hit 드롭다운 */}
          <div style={{ padding: '6px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', flexShrink: 0, gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.textSm }}>
              <span style={{ display: 'inline-block', width: 10, height: 8, background: '#3b82f6', borderRadius: 1 }} /> CPU
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.textSm }}>
              <span style={{ display: 'inline-block', width: 10, height: 8, background: '#84cc16', borderRadius: 1 }} /> Memory
            </span>
            <div style={{ flex: 1 }} />
            <select style={{ border:`1px solid ${C.border}`, borderRadius:3, padding:'2px 5px', fontSize:10, color: C.textMd, background: C.surface, cursor:'pointer' }}>
              <option>Tps</option>
              <option>Active Session</option>
              <option>Long Session</option>
              <option>Lock Session</option>
            </select>
            <select style={{ border:`1px solid ${C.border}`, borderRadius:3, padding:'2px 5px', fontSize:10, color: C.textMd, background: C.surface, cursor:'pointer' }}>
              <option>Rows Hit Ratio</option>
              <option>Block Hit Ratio</option>
              <option>Cache Hit Ratio</option>
              <option>Blks Read</option>
            </select>
          </div>

          {/* 듀얼바 인스턴스 목록 */}
          <div style={{ padding: '10px 14px 0', flexShrink: 0 }}>
            {sortedInst.map((idx, rank) => (
              <DualBarRow
                key={INSTANCES[idx].id}
                inst={INSTANCES[idx]}
                cpuVal={OV_DATA[idx].cpu}
                memVal={OV_DATA[idx].mem}
                tpsVal={OV_DATA[idx].tps}
                rowsHitVal={OV_DATA[idx].rowsHit}
                highlighted={rank === 0}
              />
            ))}
          </div>

          {/* 공백 — bars와 DB Session Type 사이 */}
          <div style={{ flex: 1 }} />

          {/* DB Session Type */}
          <div style={{ margin: '0 10px 10px', border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 12px', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textMd, marginBottom: 4 }}>DB Session Type</div>
            <div style={{ display: 'flex', gap: 10, fontSize: 10, marginBottom: 2, flexWrap: 'wrap' }}>
              <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, background: '#ef4444', borderRadius: 1 }} /> Lock Sessio...
              </span>
              <span style={{ color: '#f97316', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, background: '#f97316', borderRadius: 1 }} /> Long Sessio...
              </span>
              <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, background: '#3b82f6', borderRadius: 1 }} /> Active Sessi...
              </span>
            </div>
            <ReactECharts option={{
              backgroundColor: '#ffffff',
              xAxis: { type: 'category', data: INSTANCES.map(i => i.short), axisLabel: { color: C.axis, fontSize: 9, rotate: 20 }, axisLine: { lineStyle: { color: C.border } } },
              yAxis: { type: 'value', min: 0, axisLabel: { color: C.axis, fontSize: 9 }, splitLine: { lineStyle: { color: C.split } } },
              series: [
                { name:'Lock',   type:'bar', stack:'a', data: SESSION_TYPE_DATA.map(d => d.lock),   itemStyle:{ color:'#ef4444' }, barMaxWidth:16 },
                { name:'Long',   type:'bar', stack:'a', data: SESSION_TYPE_DATA.map(d => d.long),   itemStyle:{ color:'#f97316' }, barMaxWidth:16 },
                { name:'Active', type:'bar', stack:'a', data: SESSION_TYPE_DATA.map(d => d.active), itemStyle:{ color:'#3b82f6' }, barMaxWidth:16 },
              ],
              grid: { left:28, right:6, top:6, bottom:46 },
              tooltip: { trigger:'axis' },
            }} style={{ height: 160 }} />
          </div>
        </div>

        {/* ═══ MIDDLE: Rank ═══ */}
        <div style={{ background: C.surface, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, borderRadius: 6 }}>
          <div style={{ ...colHeader('Rank') }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 10, minHeight: 0, gap: 10 }}>
            {/* 6 Rank Cards - 고정 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, flexShrink: 0 }}>
              {RANK_METRICS.map((m, i) => (
                <RankCard key={m.id} metric={m as any} active={activeRank === i} onClick={() => setActiveRank(i)} />
              ))}
            </div>

            {/* 대형 차트 — 남은 공간 전부 */}
            <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: 12, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* 헤더 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
                <span style={{ fontWeight: 600, fontSize: 12, color: C.text }}>{curMetric.label}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['rank','ratio'] as const).map(m => (
                    <button key={m} onClick={() => setRankMode(m)} style={{ padding: '3px 12px', borderRadius: 4, border: `1px solid ${rankMode===m ? C.activeBd : C.border}`, cursor: 'pointer', fontSize: 11, background: rankMode===m ? C.activeBd : C.surface, color: rankMode===m ? '#fff' : C.textSm }}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {/* 바 차트 — flex:1 */}
              <div style={{ flex: 1, minHeight: 0 }}>
                <RankBarChart metric={curMetric as any} mode={rankMode} height="100%" />
              </div>
              {/* 라인 차트 섹션 — flex:1 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, paddingTop: 10, borderTop: `1px solid ${C.border}`, marginTop: 10 }}>
                <div style={{ fontSize: 11, color: C.textSm, marginBottom: 4, flexShrink: 0 }}>{curMetric.label}</div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ReactECharts option={{
                    backgroundColor: '#ffffff',
                    tooltip: { trigger: 'axis' },
                    legend: { show: false },
                    xAxis: { type:'category', data: RANK_TIMES, axisLabel:{ color: C.axis, fontSize:10 }, axisLine:{ lineStyle:{ color: C.border } }, splitLine:{ show:false } },
                    yAxis: { type:'value', axisLabel:{ color: C.axis, fontSize:10 }, splitLine:{ lineStyle:{ color: C.split } } },
                    series: INSTANCES.slice(0,4).map((inst, i) => ({
                      name: inst.name, type:'line',
                      data: makeSeriesData(curMetric.vals[i] || 10, 5),
                      lineStyle:{ width:1.5, color: inst.color }, itemStyle:{ color: inst.color },
                      symbol:'none', smooth:false,
                    })),
                    grid: { left:36, right:10, top:8, bottom:24 },
                  }} style={{ height: '100%' }} />
                </div>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:6, flexShrink: 0 }}>
                  {INSTANCES.map(inst => (
                    <span key={inst.id} style={{ fontSize:10, color: C.textSm, display:'flex', alignItems:'center', gap:4 }}>
                      <span style={{ display:'inline-block', width:20, height:2, background: inst.color }} />{inst.short}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: Real Time Monitor ═══ */}
        <div style={{ background: C.surface, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, borderRadius: 6 }}>
          <div style={{ ...colHeader('Real Time Monitor') }} />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 10px', minHeight: 0, gap: 8 }}>
            {/* Slow Query — 고정 */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 10px', flexShrink: 0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <span style={{ fontWeight:600, fontSize:11 }}>Slow Query</span>
                <span style={{ fontSize:9, color: C.textSm }}>Max Elapsed Count · Max Elapsed Duration(s)</span>
              </div>
              {/* 인스턴스 범례 */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                {INSTANCES.map(inst => (
                  <span key={inst.id} style={{ fontSize:9, color: C.textSm, display:'flex', alignItems:'center', gap:3 }}>
                    <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background: inst.color }} />{inst.short}
                  </span>
                ))}
              </div>
              <div style={{ cursor:'pointer', position:'relative' }} onClick={() => setSqModal(true)}>
                <ReactECharts option={mvSqScatterOpt(MV_SQ_DOTS)} style={{ height: 100 }} />
                <div style={{ position:'absolute', bottom:8, right:8, fontSize:9, color: C.axis, pointerEvents:'none' }}>click to detail</div>
              </div>
            </div>

            {/* RT 차트 슬롯 3개 — 각각 flex:1 균등 분배 */}
            {rtSelected.map((metricId, slotIdx) => {
              const metric    = RT_METRIC_POOL.find(m => m.id === metricId) ?? RT_METRIC_POOL[0]
              const slideOpen = rtSlideOpen === slotIdx
              return (
                <div key={slotIdx} style={{ flex: 1, background: C.surface, border:`1px solid ${C.border}`, borderRadius:6, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative', overflow: 'hidden' }}>
                  {/* 헤더 */}
                  <div style={{ display:'flex', alignItems:'center', padding:'7px 10px', borderBottom:`1px solid ${C.border}`, flexShrink: 0 }}>
                    <span style={{ fontWeight:600, fontSize:11, flex:1, color: C.text }}>{metric.label} ({metric.unit})</span>
                    <button
                      onClick={e => { e.stopPropagation(); setRtSlideOpen(slideOpen ? null : slotIdx) }}
                      style={{ background:'none', border:'none', color: C.textSm, cursor:'pointer', padding:'0 6px', fontSize:15, lineHeight:1, letterSpacing:1 }}
                    >···</button>
                  </div>
                  {/* 차트 + 범례 */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding:'6px 10px', minHeight: 0 }}>
                    <div style={{ flex: 1, minHeight: 0 }}>
                      <RTLineChart metric={metric} chartType="Line" height="100%" />
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4, flexShrink: 0 }}>
                      {INSTANCES.map(inst => (
                        <span key={inst.id} style={{ fontSize:10, color: C.textSm, display:'flex', alignItems:'center', gap:3 }}>
                          <span style={{ display:'inline-block', width:16, height:2, background: inst.color }} />{inst.short}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* 지표변경 슬라이드 패널 */}
                  {slideOpen && (
                    <>
                      <div onClick={() => setRtSlideOpen(null)} style={{ position:'absolute', inset:0, zIndex:10 }} />
                      <div style={{ position:'absolute', top:0, right:0, bottom:0, width:220, background:'#fff', boxShadow:'-3px 0 12px rgba(0,0,0,0.12)', zIndex:20, display:'flex', flexDirection:'column' }}>
                        <div style={{ padding:'8px 12px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0, background:'#f3f4f6' }}>
                          <span style={{ fontSize:11, fontWeight:700, color: C.text }}>지표 변경</span>
                          <button onClick={() => setRtSlideOpen(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:15, color: C.textSm, lineHeight:1 }}>×</button>
                        </div>
                        <div style={{ flex:1, overflowY:'auto' }}>
                          {RT_METRIC_POOL.map(m => {
                            const isSelected = m.id === metricId
                            return (
                              <div
                                key={m.id}
                                onClick={() => {
                                  setRtSelected(prev => prev.map((id, i) => i === slotIdx ? m.id : id))
                                  setRtSlideOpen(null)
                                }}
                                style={{ padding:'9px 14px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${C.split}`, background: isSelected ? C.active : 'transparent', fontSize:11, color: isSelected ? C.activeBd : C.textMd, fontWeight: isSelected ? 600 : 400 }}
                                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#f9fafb' }}
                                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                              >
                                <span>{m.label}</span>
                                <span style={{ fontSize:10, color: C.axis }}>({m.unit})</span>
                                {isSelected && <span style={{ color: C.activeBd, fontSize:13, marginLeft:4 }}>✓</span>}
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
      </div>

      {/* ══ SQL Elapsed List 팝업 ══ */}
      {sqModal && (
        <>
          <div onClick={() => { setSqModal(false); setSqPidPanel(null) }} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:300 }} />
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:301, display:'flex', background:'#fff', borderRadius:8, boxShadow:'0 12px 48px rgba(0,0,0,.25)', overflow:'hidden', width: sqPidPanel ? Math.max(sqPopupW, 1100) : sqPopupW, height:sqPopupH, maxWidth:'96vw', maxHeight:'92vh' }}>

            {/* 왼쪽: SQL Elapsed List */}
            <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              {/* 헤더 */}
              <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.border}`, background:'#f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                <span style={{ fontSize:13, fontWeight:700, color: C.text }}>
                  SQL Elapsed List ({SQ_TICK_TIMES[0]} ~ {SQ_TICK_TIMES[SQ_TICK_TIMES.length-1]})
                </span>
                <button onClick={() => { setSqModal(false); setSqPidPanel(null) }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color: C.textSm, lineHeight:1 }}>×</button>
              </div>

              {/* 산점도 */}
              <div style={{ flexShrink:0 }}>
                <ReactECharts option={mvSqScatterOpt(sqFiltered, '#ffffff')} style={{ height: sqPopupChartH }} />
                <div
                  onMouseDown={e => startChartResize(e, sqPopupChartH, setSqPopupChartH)}
                  style={{ height:5, cursor:'s-resize', background:'transparent', borderBottom:`2px solid ${C.border}`, transition:'background .15s' }}
                  onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background=C.border}
                  onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background='transparent'}
                />
              </div>

              {/* 인스턴스 범례 */}
              <div style={{ display:'flex', gap:12, padding:'6px 14px', borderBottom:`1px solid ${C.border}`, flexShrink:0, background:'#fafbfc', flexWrap:'wrap' }}>
                {INSTANCES.map(inst => (
                  <span key={inst.id} style={{ fontSize:10, color: C.textSm, display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background: inst.color }} />{inst.short}
                  </span>
                ))}
              </div>

              {/* 필터 바 */}
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderBottom:`1px solid ${C.border}`, flexShrink:0, background:'#fafbfc' }}>
                <select value={sqFilterMode} onChange={e => setSqFilterMode(e.target.value as 'OR'|'AND')}
                  style={{ padding:'4px 8px', fontSize:12, border:`1px solid ${C.borderMd}`, borderRadius:4, background:'#fff', color: C.textMd, cursor:'pointer', height:34, flexShrink:0 }}>
                  <option>OR</option><option>AND</option>
                </select>
                <MvFilterBar
                  filters={sqFilters}
                  onAdd={chip => setSqFilters(prev => [...prev, chip])}
                  onRemove={id => setSqFilters(prev => prev.filter(f => f.id !== id))}
                  onClear={() => setSqFilters([])}
                />
                <span style={{ fontSize:11, color: C.axis, flexShrink:0 }}>{sqFiltered.length}/{MV_SQ_DOTS.length}</span>
              </div>

              {/* 테이블 */}
              <div style={{ flex:1, overflowY:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                  <thead>
                    <tr style={{ background:'#f3f4f6', position:'sticky', top:0 }}>
                      {['Instance Name','PID','User Name','App Name','Client Address','Client Host Name','Elapsed Time (sec)','SQL Text'].map(h=>(
                        <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontWeight:600, color: C.textSm, whiteSpace:'nowrap', borderBottom:`1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sqFiltered.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding:'24px', textAlign:'center', color: C.axis, fontSize:12 }}>필터 조건에 맞는 데이터가 없습니다.</td></tr>
                    ) : sqFiltered.map((d,i) => {
                      const inst = INSTANCES[d.instIdx]
                      return (
                        <tr key={i}
                          style={{ borderBottom:`1px solid ${C.split}`, background: sqPidPanel===d.pid ? C.active : 'transparent' }}
                          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background = sqPidPanel===d.pid ? C.active : '#f9fafb'}
                          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background = sqPidPanel===d.pid ? C.active : 'transparent'}
                        >
                          <td style={{ padding:'5px 10px' }}>
                            <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
                              <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background: inst?.color, flexShrink:0 }} />
                              <span style={{ color: C.textMd }}>{inst?.short}</span>
                            </span>
                          </td>
                          <td style={{ padding:'5px 10px' }}>
                            <span onClick={() => setSqPidPanel(p => p===d.pid ? null : d.pid)} style={{ color: C.activeBd, fontWeight:700, cursor:'pointer', textDecoration:'underline' }}>{d.pid}</span>
                          </td>
                          <td style={{ padding:'5px 10px', color: C.textMd }}>{d.userName}</td>
                          <td style={{ padding:'5px 10px', color: C.textSm }}>{d.appName}</td>
                          <td style={{ padding:'5px 10px', color: C.textSm, fontVariantNumeric:'tabular-nums' }}>{d.clientAddr}</td>
                          <td style={{ padding:'5px 10px', color: C.textSm }}>{d.clientHost}</td>
                          <td style={{ padding:'5px 10px', fontWeight:700, color: d.elapsed>40?'#ef4444':d.elapsed>20?'#f59e0b':'#16a34a', fontVariantNumeric:'tabular-nums' }}>{d.elapsed.toFixed(3)}</td>
                          <td style={{ padding:'5px 10px', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: C.textSm }}>{d.sqlText}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 우측: PID 세션 정보 패널 */}
            {sqPidPanel !== null && (() => {
              const dot = MV_SQ_DOTS.find(d => d.pid === sqPidPanel)
              const inst = dot ? INSTANCES[dot.instIdx] : null
              return (
                <div style={{ width:360, flexShrink:0, borderLeft:`2px solid ${C.border}`, display:'flex', flexDirection:'column', overflow:'hidden', background:'#fafbfc' }}>
                  <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}`, background:'#f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                    <span style={{ fontSize:12, fontWeight:700, color: C.text }}>Session Info — PID {sqPidPanel}</span>
                    <button onClick={() => setSqPidPanel(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color: C.textSm }}>×</button>
                  </div>
                  <div style={{ padding:'12px 14px', overflowY:'auto', flex:1 }}>
                    {inst && (
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, padding:'8px 10px', background:'#fff', border:`1px solid ${C.border}`, borderRadius:6 }}>
                        <span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background: inst.color, flexShrink:0 }} />
                        <span style={{ fontSize:12, fontWeight:600, color: C.text }}>{inst.name}</span>
                      </div>
                    )}
                    {dot && [
                      ['PID',            String(dot.pid)],
                      ['Instance',       inst?.name ?? '-'],
                      ['User Name',      dot.userName],
                      ['App Name',       dot.appName],
                      ['Client Address', dot.clientAddr],
                      ['Client Host',    dot.clientHost],
                    ].map(([k,v])=>(
                      <div key={k} style={{ display:'flex', borderBottom:`1px solid ${C.split}`, padding:'8px 0' }}>
                        <span style={{ width:120, flexShrink:0, fontSize:11, color: C.textSm, fontWeight:600 }}>{k}</span>
                        <span style={{ fontSize:11, color: C.text, wordBreak:'break-all' }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ marginTop:16 }}>
                      <div style={{ fontSize:11, fontWeight:700, color: C.textMd, marginBottom:8 }}>Slow Queries (this PID)</div>
                      {MV_SQ_DOTS.filter(d=>d.pid===sqPidPanel).map((d,i)=>(
                        <div key={i} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:6, padding:'8px 10px', marginBottom:6 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                            <span style={{ fontSize:10, color: C.textSm }}>{d.time}</span>
                            <span style={{ fontSize:11, fontWeight:700, color: d.elapsed>40?'#ef4444':'#f59e0b' }}>{d.elapsed.toFixed(3)}s</span>
                          </div>
                          <div style={{ fontSize:10, color: C.activeBd, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.sqlText}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* 팝업 리사이즈 핸들 */}
            <div onMouseDown={e=>startPopupResize(e,'e')} style={{ position:'absolute', top:0, right:0, width:6, height:'100%', cursor:'ew-resize', zIndex:10 }} />
            <div onMouseDown={e=>startPopupResize(e,'s')} style={{ position:'absolute', bottom:0, left:0, width:'100%', height:6, cursor:'s-resize', zIndex:10 }} />
            <div onMouseDown={e=>startPopupResize(e,'se')} style={{ position:'absolute', bottom:0, right:0, width:14, height:14, cursor:'se-resize', zIndex:11, background:'linear-gradient(135deg, transparent 50%, #c9cdd2 50%)', borderRadius:'0 0 8px 0' }} />
          </div>
        </>
      )}
    </div>
  )
}
