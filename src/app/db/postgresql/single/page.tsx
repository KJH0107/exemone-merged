'use client'
import { useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'

/* ══════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════ */
const TOP_SESSIONS = [
  { rank:1, user:'app_user',  cpu:42.1, elapsed:'0.12s' },
  { rank:2, user:'analytics', cpu:28.3, elapsed:'8.21s' },
  { rank:3, user:'dba',       cpu:15.2, elapsed:'1.08s' },
  { rank:4, user:'app_user',  cpu: 8.9, elapsed:'0.03s' },
  { rank:5, user:'analytics', cpu: 5.5, elapsed:'2.45s' },
]
const TOP_EVENTS = [
  { rank:1, event:'Lock:tuple',  wait:'8.21s', pct:74 },
  { rank:2, event:'IO:read',     wait:'1.20s', pct:11 },
  { rank:3, event:'Checkpoint',  wait:'0.82s', pct: 7 },
  { rank:4, event:'WAL:write',   wait:'0.63s', pct: 6 },
  { rank:5, event:'Network',     wait:'0.18s', pct: 2 },
]
const TOP_SQL = [
  { rank:1, sql:'SELECT * FROM orders WHERE status = $1',          elapsed:4821, calls:248 },
  { rank:2, sql:'UPDATE products SET stock = stock - 1',           elapsed:2340, calls: 89 },
  { rank:3, sql:'SELECT u.*, p.* FROM users u JOIN profiles p',    elapsed:1820, calls:412 },
  { rank:4, sql:'INSERT INTO audit_log (action, user_id, ts)',      elapsed: 980, calls:631 },
  { rank:5, sql:'DELETE FROM sessions WHERE last_active < NOW()',   elapsed: 730, calls: 44 },
]
const TOP_FUNCTION = [
  { rank:1, func:'get_user_orders',     totalMs:12480, calls:248 },
  { rank:2, func:'update_product_stock',totalMs: 5200, calls: 89 },
  { rank:3, func:'calc_shipping_fee',   totalMs: 3100, calls:312 },
  { rank:4, func:'audit_log_insert',    totalMs: 1800, calls:631 },
  { rank:5, func:'session_cleanup',     totalMs:  920, calls: 44 },
]
const OBJECTS = [
  { name: 'Tables',    count: 148, used: 84 },
  { name: 'Indexes',   count: 312, used: 91 },
  { name: 'Views',     count: 23,  used: 61 },
  { name: 'Sequences', count: 47,  used: 100 },
  { name: 'Functions', count: 89,  used: 45 },
]
const SESSIONS: { pid:number; user:string; db:string; state:string; wait:string; elapsed:string; sql:string }[] = [
  { pid:31842, user:'app_user',  db:'demo3', state:'active', wait:'-',          elapsed:'0.12s', sql:'SELECT * FROM orders WHERE status = $1 LIMIT 100' },
  { pid:31801, user:'app_user',  db:'demo3', state:'idle',   wait:'-',          elapsed:'2.45s', sql:'idle' },
  { pid:31755, user:'analytics', db:'demo3', state:'active', wait:'Lock:tuple', elapsed:'8.21s', sql:'UPDATE products SET stock = stock - 1 WHERE id = $1' },
  { pid:31710, user:'analytics', db:'demo3', state:'idle',   wait:'-',          elapsed:'0.03s', sql:'SELECT pg_sleep(0)' },
  { pid:31698, user:'dba',       db:'demo3', state:'active', wait:'-',          elapsed:'1.08s', sql:'EXPLAIN ANALYZE SELECT * FROM sessions JOIN users ON ...' },
  { pid:31620, user:'app_user',  db:'demo3', state:'idle',   wait:'-',          elapsed:'14.3s', sql:'idle' },
]
const SQL_TEXTS = [
  'SELECT * FROM orders WHERE status = $1 LIMIT 100',
  'UPDATE products SET stock = stock - 1 WHERE id = $1',
  'SELECT u.*, p.* FROM users u JOIN profiles p ON u.id = p.user_id WHERE u.active = true',
  'INSERT INTO audit_log (action, user_id, ts) VALUES ($1, $2, NOW())',
  'DELETE FROM sessions WHERE last_active < NOW() - INTERVAL \'30 minutes\'',
  'SELECT COUNT(*) FROM orders o JOIN order_items oi ON o.id = oi.order_id',
  'EXPLAIN ANALYZE SELECT * FROM large_table WHERE indexed_col = $1',
  'SELECT pid, query, state FROM pg_stat_activity WHERE state != \'idle\'',
]
function genSeries(n:number, base:number, range:number) {
  return Array.from({ length:n }, (_,i) => [i, +(base + (Math.sin(i*0.3)*range*0.4 + (Math.random()-0.5)*range*0.6)).toFixed(2)])
}
const N = 30
const realtimeCharts = [
  { label:'Blks Hit (count)',  subtitle:'', data:genSeries(N,4800,400),color:'#3b82f6', unit:''  },
  { label:'Blks Read (blocks)',subtitle:'', data:genSeries(N,18.4,2),  color:'#a78bfa', unit:''  },
  { label:'TPS (count/sec)',   subtitle:'', data:genSeries(N,320,80),  color:'#22d3ee', unit:''  },
  { label:'Rows Hit Ratio (%)',subtitle:'', data:genSeries(N,98.2,3),  color:'#22c55e', unit:'%' },
]

/* ══════════════════════════════════════════════════════════
   CHART OPTIONS
══════════════════════════════════════════════════════════ */
function lineOpt(data:number[][], color:string, yUnit='') {
  const xLabels = Array.from({ length:N }, (_,i) => {
    const d = new Date(Date.now() - (N-i)*5000)
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`
  })
  return {
    backgroundColor:'transparent',
    grid:{ top:8, right:16, bottom:20, left:44 },
    xAxis:{ type:'category', data:xLabels, axisLine:{ lineStyle:{ color:'#c9cdd2' } }, axisLabel:{ color:'#9fa5ae', fontSize:9, interval:9 }, axisTick:{ show:false } },
    yAxis:{ type:'value', axisLabel:{ color:'#9fa5ae', fontSize:9, formatter:(v:number)=>`${v}${yUnit}` }, splitLine:{ lineStyle:{ color:'#e3e7ea', type:'dashed' } } },
    series:[{ type:'line', data:data.map(d=>d[1]), smooth:true, symbol:'none', lineStyle:{ color, width:1.5 }, areaStyle:{ color:{ type:'linear',x:0,y:0,x2:0,y2:1, colorStops:[{offset:0,color:color+'30'},{offset:1,color:color+'00'}] } } }],
    tooltip:{ trigger:'axis', backgroundColor:'#fff', borderColor:'#c9cdd2', textStyle:{ color:'#282c32', fontSize:11 } },
  }
}
function donutOpt(pct:number) {
  return {
    backgroundColor:'transparent',
    series:[{ type:'gauge', startAngle:200, endAngle:-20, min:0, max:100, radius:'92%', center:['50%','60%'], progress:{ show:true, width:10, itemStyle:{ color:'#3b82f6' } }, axisLine:{ lineStyle:{ width:10, color:[[1,'#e3e7ea']] } }, axisTick:{ show:false }, splitLine:{ show:false }, axisLabel:{ show:false }, pointer:{ show:false }, detail:{ valueAnimation:true, formatter:'{value}%', color:'#282c32', fontSize:13, fontWeight:700, offsetCenter:[0,'10%'] }, data:[{ value:pct }] }],
  }
}
function trendBarOpt(data:number[], color:string) {
  return {
    backgroundColor:'transparent',
    grid:{ top:2, right:2, bottom:2, left:2 },
    xAxis:{ type:'category', show:false, data:data.map((_,i)=>i) },
    yAxis:{ type:'value', show:false },
    series:[{ type:'bar', data, itemStyle:{ color, borderRadius:1 }, barMaxWidth:6 }],
    tooltip:{ show:false },
  }
}

/* HexGrid */
function HexGrid() {
  const colors = ['#3b82f6','#3b82f6','#3b82f6','#3b82f6','#3b82f6','#3b82f6','#3b82f6','#3b82f6','#3b82f6','#3b82f6','#3b82f6','#22d3ee','#22d3ee','#22d3ee','#22d3ee','#22d3ee','#22d3ee','#22d3ee','#22d3ee','#22d3ee','#e3e7ea','#e3e7ea','#e3e7ea','#e3e7ea','#e3e7ea','#e3e7ea','#e3e7ea','#e3e7ea','#e3e7ea','#e3e7ea','#e3e7ea']
  const R=10, rows=4, cols=8, hexes:React.ReactElement[]=[]
  let ci=0
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) {
    const x=c*(R*1.75)+(r%2===1?R*0.875:0)+R, y=r*(R*1.52)+R
    const color=colors[ci%colors.length]; ci++
    const pts=Array.from({length:6},(_,i)=>{ const a=Math.PI/180*(60*i-30); return `${x+R*0.85*Math.cos(a)},${y+R*0.85*Math.sin(a)}` }).join(' ')
    hexes.push(<polygon key={`${r}-${c}`} points={pts} fill={color} opacity={0.85} />)
  }
  return <svg width="100%" viewBox={`0 0 ${cols*R*1.75+R*2} ${rows*R*1.52+R*2}`} style={{ maxHeight:80 }}>{hexes}</svg>
}

/* Clock을 독립 컴포넌트로 분리 — 1초 리렌더 격리 */
function LiveClock() {
  const [now,setNow] = useState(new Date())
  useEffect(() => { const t=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t) },[])
  const str = now.toLocaleString('ko-KR',{ year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false }).replace(/\. /g,'.').replace(',','')
  return <span style={{ fontSize:11, color:'var(--text-secondary,#626872)', fontVariantNumeric:'tabular-nums' }}>{str}</span>
}

/* ══════════════════════════════════════════════════════════
   STYLES (라이트 테마 CSS 변수 기반)
══════════════════════════════════════════════════════════ */
const S = {
  card:    { background:'var(--card-bg,#fff)', border:'1px solid var(--border,#c9cdd2)', borderRadius:8, overflow:'hidden' } as React.CSSProperties,
  header:  { padding:'7px 12px', borderBottom:'1px solid var(--border,#c9cdd2)', fontSize:11, fontWeight:700, color:'var(--text-muted,#80868f)', letterSpacing:0.4, background:'var(--grid-header-bg,#edf0f2)', display:'flex', alignItems:'center', justifyContent:'space-between' } as React.CSSProperties,
  page:    { display:'flex', flexDirection:'column' as const, height:'100vh', background:'var(--main-bg-color,#e3e7ea)', color:'var(--text-primary,#282c32)', fontFamily:'var(--font-family-base,Pretendard),sans-serif', fontSize:12, overflow:'hidden' },
  topbar:  { height:40, flexShrink:0, background:'var(--card-bg,#fff)', borderBottom:'1px solid var(--border,#c9cdd2)', display:'flex', alignItems:'center', padding:'0 16px', gap:6, zIndex:10 } as React.CSSProperties,
  left:    { width:540, flexShrink:0, overflowY:'auto' as const, borderRight:'1px solid var(--border,#c9cdd2)', display:'flex', flexDirection:'column' as const, gap:1, background:'var(--main-bg-color,#e3e7ea)' },
  center:  { flex:1, minWidth:0, overflowY:'auto' as const, borderRight:'1px solid var(--border,#c9cdd2)', background:'var(--main-bg-color,#e3e7ea)', display:'flex', flexDirection:'column' as const, gap:1 },
  right:   { width:540, flexShrink:0, overflowY:'auto' as const, background:'var(--main-bg-color,#e3e7ea)', display:'flex', flexDirection:'column' as const, gap:1 },
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function PostgreSQLSingleView() {
  // clock은 LiveClock 컴포넌트로 분리됨
  const [sessionOpen,    setSessionOpen]    = useState(false)
  const [selectedPid,    setSelectedPid]    = useState<number|null>(null)
  const [adminOpen,      setAdminOpen]      = useState<Record<string,boolean>>({ vacuum:true, additional:false, alert:false })
  const toggleAdmin = (k:string) => setAdminOpen(p=>({...p,[k]:!p[k]}))

  return (
    <div style={S.page}>

      {/* ── TOP BAR ── */}
      <div style={S.topbar}>
        <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--text-muted,#80868f)' }}>
          {['데이터베이스','인스턴스','DB demo3','postgresql-1','싱글뷰','데이터베이스'].map((seg,i,arr) => (
            <span key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ color:i===arr.length-1?'var(--text-primary,#282c32)':'var(--text-muted,#80868f)', fontWeight:i===arr.length-1?600:400, cursor:'pointer' }}>{seg}</span>
              {i<arr.length-1 && <span style={{ color:'var(--border,#c9cdd2)' }}>›</span>}
            </span>
          ))}
        </div>
        <div style={{ marginLeft:16, display:'flex', gap:4 }}>
          {['All','postgresql-1','demo3'].map((chip,i) => (
            <span key={chip} style={{ padding:'2px 8px', borderRadius:4, background:i===0?'#3b82f6':'var(--grid-header-bg,#edf0f2)', color:i===0?'#fff':'var(--text-secondary,#626872)', fontSize:10, fontWeight:600, cursor:'pointer' }}>{chip}</span>
          ))}
        </div>
        <div style={{ flex:1 }} />
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 6px #22c55e', display:'inline-block' }} />
          <span style={{ fontSize:10, color:'var(--text-muted,#80868f)' }}>Live</span>
          <LiveClock />
        </div>
        <div style={{ display:'flex', gap:6, marginLeft:12 }}>
          {['⚙','📋','↗'].map(ic => (
            <button key={ic} style={{ background:'var(--grid-header-bg,#edf0f2)', border:'1px solid var(--border,#c9cdd2)', color:'var(--text-muted,#80868f)', width:26, height:26, borderRadius:4, cursor:'pointer', fontSize:12 }}>{ic}</button>
          ))}
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', position:'relative' }}>

        {/* ══ LEFT ══ */}
        <div style={S.left}>

          {/* Grouping Summary 헤더 */}
          <div style={{ padding:'8px 12px 4px', fontSize:11, fontWeight:700, color:'var(--text-secondary,#626872)', borderBottom:'1px solid var(--border,#c9cdd2)', background:'var(--card-bg,#fff)', flexShrink:0 }}>
            Grouping Summary
          </div>

          {/* Statistics & Events */}
          <div style={S.card}>
            <div style={S.header}>
              <span>Statistics &amp; Events</span>
              <span style={{ color:'#3b82f6', fontSize:10, cursor:'pointer' }}>상세 ›</span>
            </div>
            {/* 두 테이블 가로 배치 */}
            <div style={{ padding:'5px 8px 6px', display:'flex', gap:8 }}>
              {/* Top Diff Statistics */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:9, fontWeight:700, color:'var(--text-muted,#80868f)', marginBottom:3 }}>Top Diff Statistics(Sum) for 10min</div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:9 }}>
                  <thead>
                    <tr style={{ background:'var(--grid-header-bg,#edf0f2)' }}>
                      {['#','Name','Diff%','Value'].map(h=><th key={h} style={{ padding:'2px 4px', textAlign:'left', color:'var(--text-muted,#80868f)', fontWeight:600 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {TOP_SESSIONS.map(s=>(
                      <tr key={s.rank} style={{ borderBottom:'1px solid var(--border-light,#d8dbde)' }}>
                        <td style={{ padding:'2px 4px', color:'var(--text-muted,#80868f)' }}>{s.rank}</td>
                        <td style={{ padding:'2px 4px', color:'var(--text-secondary,#626872)', maxWidth:46, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.user}</td>
                        <td style={{ padding:'2px 4px', color:s.cpu>30?'#ef4444':s.cpu>15?'#f59e0b':'var(--text-primary,#282c32)', fontWeight:600 }}>{s.cpu}%</td>
                        <td style={{ padding:'2px 4px', color:'var(--text-muted,#80868f)', fontVariantNumeric:'tabular-nums' }}>{s.elapsed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Top Events */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:9, fontWeight:700, color:'var(--text-muted,#80868f)', marginBottom:3 }}>Top Event for 10min</div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:9 }}>
                  <thead>
                    <tr style={{ background:'var(--grid-header-bg,#edf0f2)' }}>
                      {['#','Name','Type','Value'].map(h=><th key={h} style={{ padding:'2px 4px', textAlign:'left', color:'var(--text-muted,#80868f)', fontWeight:600 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {TOP_EVENTS.map(e=>(
                      <tr key={e.rank} style={{ borderBottom:'1px solid var(--border-light,#d8dbde)' }}>
                        <td style={{ padding:'2px 4px', color:'var(--text-muted,#80868f)' }}>{e.rank}</td>
                        <td style={{ padding:'2px 4px', color:'var(--text-secondary,#626872)', maxWidth:40, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.event}</td>
                        <td style={{ padding:'2px 4px', color:'var(--text-muted,#80868f)', fontSize:8 }}>Wait</td>
                        <td style={{ padding:'2px 4px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                            <div style={{ width:Math.round(e.pct*0.5), height:8, background:'#3b82f6', borderRadius:1, minWidth:2 }} />
                            <span style={{ color:'var(--text-muted,#80868f)', fontSize:8, fontVariantNumeric:'tabular-nums' }}>{e.pct}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SQL & Function */}
          <div style={S.card}>
            <div style={S.header}>
              <span>SQL &amp; Function</span>
              <span style={{ color:'#3b82f6', fontSize:10, cursor:'pointer' }}>상세 ›</span>
            </div>
            <div style={{ padding:'5px 8px 6px', display:'flex', gap:8 }}>
              {/* Top SQL by Elapsed */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:9, fontWeight:700, color:'var(--text-muted,#80868f)', marginBottom:3 }}>Top SQL for 10min Order By Temp Blks Read</div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:9 }}>
                  <thead>
                    <tr style={{ background:'var(--grid-header-bg,#edf0f2)' }}>
                      {['#','SQL','ms'].map(h=><th key={h} style={{ padding:'2px 4px', textAlign:'left', color:'var(--text-muted,#80868f)', fontWeight:600 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {TOP_SQL.map(s=>(
                      <tr key={s.rank} style={{ borderBottom:'1px solid var(--border-light,#d8dbde)' }}>
                        <td style={{ padding:'2px 4px', color:'var(--text-muted,#80868f)' }}>{s.rank}</td>
                        <td style={{ padding:'2px 4px', maxWidth:55, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          <span style={{ color:'var(--text-secondary,#626872)' }}>{s.sql.substring(0,18)}</span>
                        </td>
                        <td style={{ padding:'2px 4px', color:s.elapsed>3000?'#ef4444':s.elapsed>1000?'#f59e0b':'var(--text-primary,#282c32)', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{s.elapsed.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Top Function by Total Time */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:9, fontWeight:700, color:'var(--text-muted,#80868f)', marginBottom:3 }}>Top Function for 10min Order By Total Time</div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:9 }}>
                  <thead>
                    <tr style={{ background:'var(--grid-header-bg,#edf0f2)' }}>
                      {['#','Function','ms'].map(h=><th key={h} style={{ padding:'2px 4px', textAlign:'left', color:'var(--text-muted,#80868f)', fontWeight:600 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {TOP_FUNCTION.map(f=>(
                      <tr key={f.rank} style={{ borderBottom:'1px solid var(--border-light,#d8dbde)' }}>
                        <td style={{ padding:'2px 4px', color:'var(--text-muted,#80868f)' }}>{f.rank}</td>
                        <td style={{ padding:'2px 4px', maxWidth:55, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          <span style={{ color:'var(--text-secondary,#626872)' }}>{f.func}</span>
                        </td>
                        <td style={{ padding:'2px 4px', color:'#a78bfa', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{f.totalMs.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Object */}
          <div style={S.card}>
            <div style={S.header}><span>Object</span></div>
            {/* Index Scan vs Table Scan */}
            <div style={{ padding:'6px 10px 4px' }}>
              <div style={{ fontSize:9, fontWeight:700, color:'var(--text-muted,#80868f)', marginBottom:4 }}>Index Scan vs. Table Scan</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ flex:1 }}>
                  <ReactECharts option={donutOpt(1)} style={{ height:70 }} opts={{ renderer:'svg' }} />
                </div>
                <div style={{ textAlign:'center', fontSize:10, fontWeight:700, color:'var(--text-muted,#80868f)' }}>VS</div>
                <div style={{ flex:1 }}>
                  <ReactECharts option={donutOpt(99)} style={{ height:70 }} opts={{ renderer:'svg' }} />
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-around', fontSize:9, color:'var(--text-muted,#80868f)', marginTop:-6, marginBottom:4 }}>
                <span>Index <b style={{ color:'#3b82f6' }}>1%</b></span>
                <span>Table <b style={{ color:'#ef4444' }}>99%</b></span>
              </div>
            </div>
            {/* Top Object by Scan */}
            <div style={{ borderTop:'1px solid var(--border,#c9cdd2)', padding:'5px 10px 6px' }}>
              <div style={{ fontSize:9, fontWeight:700, color:'var(--text-muted,#80868f)', marginBottom:4 }}>Top Object for 10min Order By Scan</div>
              {[
                { name:'ingredient_detail', val:75800 },
                { name:'ingredient_log',    val:40900 },
                { name:'pg_sos_detail',     val:24600 },
                { name:'ingredient_info',   val:18200 },
                { name:'pg_soa_events',     val: 9100 },
              ].map(o=>(
                <div key={o.name} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                  <span style={{ fontSize:9, color:'var(--text-secondary,#626872)', width:90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flexShrink:0 }}>{o.name}</span>
                  <div style={{ flex:1, height:10, background:'var(--main-bg-color,#e3e7ea)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ width:`${Math.round(o.val/75800*100)}%`, height:'100%', background:'#3b82f6', borderRadius:2 }} />
                  </div>
                  <span style={{ fontSize:9, color:'var(--text-muted,#80868f)', fontVariantNumeric:'tabular-nums', flexShrink:0, width:40, textAlign:'right' }}>{(o.val/1000).toFixed(1)}K</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trend Summary */}
          <div style={S.card}>
            <div style={S.header}><span>Trend Summary</span></div>
            <div style={{ padding:'6px 10px' }}>
              {[
                { label:'DB Stat: Tup Updated (count)', sub:'Tup Updated (count)', data:Array.from({length:12},(_,i)=>+(12000+Math.sin(i*0.8)*3000+(Math.random()-0.5)*2000).toFixed(0)), color:'#3b82f6' },
                { label:'DB Stat: (OS) Cpu  Usage (%)', sub:'(OS) Cpu  Usage (%)',  data:Array.from({length:12},()=>+(Math.random()*0.6+0.1).toFixed(2)), color:'#3b82f6' },
              ].map(t => (
                <div key={t.label} style={{ marginBottom:8 }}>
                  <div style={{ fontSize:9, color:'var(--text-muted,#80868f)', marginBottom:2 }}>{t.label}</div>
                  <ReactECharts option={trendBarOpt(t.data, t.color)} style={{ height:40, width:'100%' }} opts={{ renderer:'svg' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ CENTER ══ */}
        <div style={S.center}>

          {/* Overview */}
          <div style={{ ...S.card, margin:0, borderRadius:0, flexShrink:0 }}>
            <div style={S.header}><span>Overview</span></div>
            <div style={{ padding:'12px 16px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:12 }}>
                <div style={{ width:48, height:48, borderRadius:10, background:'linear-gradient(135deg,#336791,#1a3a5c)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'#fff', fontWeight:800, flexShrink:0 }}>PG</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary,#282c32)', marginBottom:4 }}>postgresql-1 <span style={{ fontSize:10, color:'var(--text-muted,#80868f)', fontWeight:400 }}>/ demo3</span></div>
                  <div style={{ display:'flex', gap:16 }}>
                    {[{label:'● Active',value:11,color:'#22c55e'},{label:'○ Idle',value:20,color:'#9fa5ae'},{label:'⚠ Wait',value:2,color:'#f59e0b'},{label:'✕ Idle Trans',value:1,color:'#bec4cb'}].map(s => (
                      <div key={s.label} style={{ textAlign:'center' }}>
                        <div style={{ fontSize:16, fontWeight:700, color:s.color }}>{s.value}</div>
                        <div style={{ fontSize:9, color:'var(--text-muted,#80868f)', whiteSpace:'nowrap' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ width:110, flexShrink:0 }}>
                  <ReactECharts option={donutOpt(31)} style={{ height:90, width:110 }} opts={{ renderer:'svg' }} />
                  <div style={{ textAlign:'center', fontSize:9, color:'var(--text-muted,#80868f)', marginTop:-8 }}>Connection Usage</div>
                </div>
              </div>
              <div style={{ marginBottom:12 }}><HexGrid /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                {[
                {label:'Alert',    color:'#ef4444', items:[{k:'Critical',v:0,c:'#ef4444'},{k:'Warning',v:2,c:'#f59e0b'},{k:'Total',v:2,c:'#6b7280'}]},
                {label:'Vacuum',   color:'#f59e0b', items:[{k:'Current Age',v:'2h13m',c:'#ef4444'},{k:'Usable Age',v:'2.1B',c:'#6b7280'},{k:'Age Used',v:'0.1%',c:'#22c55e'}]},
                {label:'Replication',color:'#3b82f6',items:[{k:'Primary',v:1,c:'#3b82f6'},{k:'Stand By',v:1,c:'#22c55e'},{k:'Lag',v:'0ms',c:'#22c55e'}]},
                {label:'Check Point',color:'#6b7280',items:[{k:'Backend Write',v:0,c:'#22c55e'},{k:'Avg Write',v:'2.4ms',c:'#6b7280'},{k:'Avg Write Time',v:'0.1ms',c:'#6b7280'}]},
              ].map(s => (
                  <div key={s.label} style={{ background:'var(--card-bg,#fff)', border:'1px solid var(--border,#c9cdd2)', borderRadius:6, padding:'6px 8px' }}>
                    <div style={{ fontSize:9, color:'var(--text-muted,#80868f)', fontWeight:700, marginBottom:4, borderBottom:'1px solid var(--border-light,#d8dbde)', paddingBottom:3 }}>{s.label}</div>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      {s.items.map(it=>(
                        <div key={it.k} style={{ textAlign:'center' }}>
                          <div style={{ fontSize:11, fontWeight:700, color:it.c }}>{it.v}</div>
                          <div style={{ fontSize:8, color:'var(--text-muted,#80868f)', whiteSpace:'nowrap' }}>{it.k}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background:'var(--card-bg,#fff)', border:'1px solid var(--border,#c9cdd2)', borderRadius:6, padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:10, color:'var(--text-secondary,#626872)' }}>Buffer Cache Hit Ratio</span>
                <span style={{ fontSize:18, fontWeight:700, color:'#22c55e' }}>91.47%</span>
              </div>
            </div>
          </div>

          {/* Admin Reference */}
          <div style={{ ...S.card, margin:0, borderRadius:0, flexShrink:0 }}>
            <div style={S.header}><span>Admin Reference</span></div>
            {[
              { key:'vacuum', label:'Vacuum', content:(
                <div style={{ padding:'8px 12px', fontSize:11 }}>
                  {/* Top Dead Tuple */}
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted,#80868f)', marginBottom:4 }}>Top Dead Tuple for Object</div>
                  {[
                    { name:'public.orders',    val:12480 },
                    { name:'public.sessions',  val: 8320 },
                    { name:'public.audit_log', val: 4190 },
                    { name:'public.products',  val: 1840 },
                  ].map(o=>(
                    <div key={o.name} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                      <span style={{ fontSize:10, color:'var(--text-secondary,#626872)', width:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flexShrink:0 }}>{o.name}</span>
                      <div style={{ flex:1, height:10, background:'var(--main-bg-color,#e3e7ea)', borderRadius:2, overflow:'hidden' }}>
                        <div style={{ width:`${Math.round(o.val/12480*100)}%`, height:'100%', background:'#f59e0b', borderRadius:2 }} />
                      </div>
                      <span style={{ fontSize:10, color:'var(--text-muted,#80868f)', width:42, textAlign:'right', fontVariantNumeric:'tabular-nums', flexShrink:0 }}>{o.val.toLocaleString()}</span>
                    </div>
                  ))}
                  {/* Top Vacuuming Process */}
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted,#80868f)', marginBottom:4, marginTop:10 }}>Top Vacuuming Process (sec)</div>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10 }}>
                    <thead><tr style={{ background:'var(--grid-header-bg,#edf0f2)' }}>{['Table','Type','Phase','Duration'].map(h=><th key={h} style={{ padding:'4px 8px', textAlign:'left', color:'var(--text-muted,#80868f)', fontWeight:600 }}>{h}</th>)}</tr></thead>
                    <tbody>{[
                      ['public.orders',  'AUTO',  'index cleanup', '124s'],
                      ['public.sessions','MANUAL','heap scan',     ' 47s'],
                    ].map(row=>(<tr key={row[0]} style={{ borderTop:'1px solid var(--border-light,#d8dbde)' }}>{row.map((c,ci)=><td key={ci} style={{ padding:'4px 8px', color:ci===3?'#f59e0b':'var(--text-secondary,#626872)', fontWeight:ci===3?600:400 }}>{c}</td>)}</tr>))}</tbody>
                  </table>
                </div>
              )},
              { key:'alert', label:'Alert Logs', content:(
                <div style={{ padding:'6px 12px' }}>
                  {[{level:'ERROR',msg:'could not serialize access due to concurrent update',time:'13:21:08'},{level:'WARN',msg:'autovacuum: table "demo3.public.orders" needs analyze',time:'13:18:44'},{level:'WARN',msg:'checkpoint request taking too long',time:'13:05:12'}].map((log,i)=>(
                    <div key={i} style={{ display:'flex', gap:8, padding:'4px 0', borderBottom:'1px solid var(--border-light,#d8dbde)', alignItems:'flex-start' }}>
                      <span style={{ padding:'1px 5px', borderRadius:3, fontSize:9, fontWeight:700, background:log.level==='ERROR'?'#fee2e2':'#fef9c3', color:log.level==='ERROR'?'#dc2626':'#a16207', flexShrink:0 }}>{log.level}</span>
                      <span style={{ fontSize:10, color:'var(--text-secondary,#626872)', flex:1, lineHeight:1.4 }}>{log.msg}</span>
                      <span style={{ fontSize:9, color:'var(--text-muted,#80868f)', flexShrink:0 }}>{log.time}</span>
                    </div>
                  ))}
                </div>
              )},
              { key:'additional', label:'Additional Information', content:(
                <div style={{ padding:'8px 12px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:11 }}>
                  {[['PG Version','15.3'],['Max Connections','200'],['Shared Buffers','1024 MB'],['WAL Level','replica'],['Archive Mode','on'],['Autovacuum','on']].map(([k,v])=>(
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid var(--border-light,#d8dbde)', paddingBottom:4 }}>
                      <span style={{ color:'var(--text-muted,#80868f)' }}>{k}</span>
                      <span style={{ color:'var(--text-primary,#282c32)', fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              )},
            ].map(item=>(
              <div key={item.key} style={{ borderTop:'1px solid var(--border,#c9cdd2)' }}>
                <button onClick={()=>toggleAdmin(item.key)} style={{ width:'100%', background:'none', border:'none', cursor:'pointer', padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', color:'var(--text-secondary,#626872)', fontSize:11, fontWeight:600 }}>
                  <span>{item.label}</span>
                  <span style={{ transition:'transform .2s', transform:adminOpen[item.key]?'rotate(90deg)':'none', fontSize:10 }}>›</span>
                </button>
                {adminOpen[item.key] && item.content}
              </div>
            ))}
          </div>
        </div>

        {/* ══ RIGHT ══ */}
        <div style={S.right}>

          {/* ── Slow Query (RTM 라인차트) ── */}
          <div style={{ ...S.card, margin:0, borderRadius:0, flexShrink:0 }}>
            <div style={{ ...S.header, flexDirection:'column', alignItems:'flex-start', gap:1 }}>
              <span style={{ fontSize:10 }}>Slow Query</span>
              <span style={{ fontSize:9, color:'var(--text-muted,#80868f)', fontWeight:400 }}>Max Elapsed Count · Max Elapsed Duration(s)</span>
            </div>
            <div style={{ background:'var(--card-bg,#fff)' }}>
              <ReactECharts option={lineOpt(genSeries(N,4,2),'#ef4444','')} style={{ height:90 }} opts={{ renderer:'svg' }} />
            </div>
          </div>

          <div style={S.header}><span>Real Time Monitor</span></div>
          {realtimeCharts.map(chart=>(
            <div key={chart.label} style={{ ...S.card, margin:0, borderRadius:0 }}>
              <div style={{ ...S.header, flexDirection:'column', alignItems:'flex-start', gap:1 }}>
                <span style={{ fontSize:10 }}>{chart.label}</span>
                {chart.subtitle && <span style={{ fontSize:9, color:'var(--text-muted,#80868f)', fontWeight:400 }}>{chart.subtitle}</span>}
              </div>
              <div style={{ background:'var(--card-bg,#fff)' }}>
                <ReactECharts option={lineOpt(chart.data, chart.color, chart.unit)} style={{ height:90 }} opts={{ renderer:'svg' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SESSION TAB SLIDE-UP ── */}
      <div style={{ position:'fixed', bottom:0, left:220, right:0, background:'var(--card-bg,#fff)', borderTop:'2px solid var(--border,#c9cdd2)', zIndex:100, transition:'height .3s ease', height:sessionOpen?260:32, overflow:'hidden' }}>
        <div onClick={()=>setSessionOpen(p=>!p)} style={{ height:32, display:'flex', alignItems:'center', padding:'0 16px', cursor:'pointer', gap:8, background:'var(--grid-header-bg,#edf0f2)', borderBottom:sessionOpen?'1px solid var(--border,#c9cdd2)':'none' }}>
          <span style={{ fontSize:11 }}>{sessionOpen?'▼':'▲'}</span>
          <span style={{ fontSize:11, fontWeight:700, color:'var(--text-secondary,#626872)' }}>Session Tab</span>
          <span style={{ fontSize:10, color:'var(--text-muted,#80868f)' }}>Active Session List</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            {[{color:'#22c55e',label:`Active: ${SESSIONS.filter(s=>s.state==='active').length}`},{color:'#9fa5ae',label:`Idle: ${SESSIONS.filter(s=>s.state==='idle').length}`},{color:'#f59e0b',label:'Wait: 1'}].map(b=>(
              <span key={b.label} style={{ fontSize:10, color:b.color }}>{b.label}</span>
            ))}
          </div>
        </div>
        {sessionOpen && (
          <div style={{ height:228, overflowY:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr style={{ background:'var(--grid-header-bg,#edf0f2)', position:'sticky', top:0 }}>
                  {['PID','User','DB','State','Wait','Elapsed','SQL'].map(h=>(
                    <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontWeight:600, color:'var(--text-muted,#80868f)', whiteSpace:'nowrap', borderBottom:'1px solid var(--border,#c9cdd2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SESSIONS.map(s=>(
                  <tr key={s.pid} onClick={()=>setSelectedPid(p=>p===s.pid?null:s.pid)}
                    style={{ cursor:'pointer', background:selectedPid===s.pid?'#eff6ff':'transparent', borderBottom:'1px solid var(--border-light,#d8dbde)' }}
                    onMouseEnter={e=>{if(selectedPid!==s.pid)(e.currentTarget as HTMLTableRowElement).style.background='var(--grid-hover-bg,#edf0f2)'}}
                    onMouseLeave={e=>{if(selectedPid!==s.pid)(e.currentTarget as HTMLTableRowElement).style.background='transparent'}}
                  >
                    <td style={{ padding:'5px 10px', color:'#3b82f6', fontWeight:600 }}>{s.pid}</td>
                    <td style={{ padding:'5px 10px', color:'var(--text-secondary,#626872)' }}>{s.user}</td>
                    <td style={{ padding:'5px 10px', color:'var(--text-secondary,#626872)' }}>{s.db}</td>
                    <td style={{ padding:'5px 10px' }}>
                      <span style={{ padding:'1px 6px', borderRadius:3, fontSize:10, fontWeight:600, background:s.state==='active'?'#dcfce7':'#f1f5f9', color:s.state==='active'?'#16a34a':'#64748b' }}>{s.state}</span>
                    </td>
                    <td style={{ padding:'5px 10px', color:s.wait!=='-'?'#f59e0b':'var(--text-muted,#80868f)' }}>{s.wait}</td>
                    <td style={{ padding:'5px 10px', color:'var(--text-secondary,#626872)', fontVariantNumeric:'tabular-nums' }}>{s.elapsed}</td>
                    <td style={{ padding:'5px 10px', color:'var(--text-muted,#80868f)', maxWidth:300, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.sql}</td>
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
