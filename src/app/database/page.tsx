'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import ReactECharts from 'echarts-for-react'
import SummaryBar from '@/components/database/SummaryBar'
import HexagonGrid from '@/components/database/HexagonGrid'
import InstanceTable from '@/components/database/InstanceTable'
import FilterPanel from '@/components/database/FilterPanel'
import DbOverview, { TimeRangePicker, TIME_RANGES } from '@/components/database/DbOverview'
import type { TimeRange } from '@/components/database/DbOverview'
import { TopSqlPanel, TopEventPanel } from '@/components/database/TopNPanel'
import { mockInstances, summarize } from '@/lib/mock/instances'
import {
  mockMetric, mockSessionDist, mockTopSql, mockTopEvent, mockSlowQuery,
  mockCpuSeries, mockMemSeries, mockTpsSeries, mockSessionSeries,
} from '@/lib/mock/db-metrics'
import type {
  DbInstance, InstanceStatus,
  DbMetric, SessionDistribution, TimeSeriesPoint, SlowQueryItem,
} from '@/types/db.types'
import ExportButton from '@/components/common/ExportButton'

const DB_TYPE_MAP: Record<string, string> = {
  'PostgreSQL': 'postgresql', 'MySQL': 'mysql', 'Oracle': 'oracle',
  'SQL Server': 'sqlserver', 'MongoDB': 'mongodb', 'Redis': 'redis',
  'Tibero': 'tibero', 'Cubrid': 'cubrid', 'Altibase': 'altibase',
}

export default function DatabasePage() {
  const [summaryFilter, setSummaryFilter] = useState<InstanceStatus | 'total' | null>(null)
  const [selectedInstance, setSelectedInstance] = useState<DbInstance | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['All'])
  const [selectedGroups, setSelectedGroups] = useState<string[]>(['All'])

  const totalSummary = useMemo(() => summarize(mockInstances), [])

  // 필터 적용
  const filtered = useMemo(() => {
    let list = mockInstances

    // 요약 카드 필터
    if (summaryFilter && summaryFilter !== 'total') {
      list = list.filter(i => i.status === summaryFilter)
    }

    // DB 타입 필터
    if (!selectedTypes.includes('All')) {
      const mapped = selectedTypes.map(t => DB_TYPE_MAP[t]).filter(Boolean)
      list = list.filter(i => mapped.includes(i.dbType))
    }

    // 그룹 필터
    if (!selectedGroups.includes('All')) {
      list = list.filter(i => selectedGroups.includes(i.group))
    }

    return list
  }, [summaryFilter, selectedTypes, selectedGroups])

  const handleSummarySelect = (key: InstanceStatus | 'total' | null) => {
    setSummaryFilter(prev => prev === key ? null : key)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Page Header */}
      <div style={{
        background: 'var(--header-bg)', borderBottom: '1px solid var(--border)',
        padding: '0 20px', height: 'var(--header-height)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: 'var(--header-shadow)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>오버뷰 /</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>개요</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ExportButton
            filename="db-instances"
            columns={[
              { key: 'name', label: '인스턴스명' },
              { key: 'dbType', label: 'DB 유형' },
              { key: 'status', label: '상태' },
              { key: 'host', label: '호스트' },
              { key: 'group', label: '그룹' },
            ]}
            rows={mockInstances.map(i => ({ name: i.name, dbType: i.dbType, status: i.status, host: i.host, group: i.group ?? '' }))}
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {new Date().toLocaleString('ko-KR')}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', gap: 12, padding: 12 }}>

        {/* Filter Panel — 상단부터 끝까지 */}
        <FilterPanel
          selectedTypes={selectedTypes}
          selectedGroups={selectedGroups}
          onTypeChange={setSelectedTypes}
          onGroupChange={setSelectedGroups}
        />

        {/* Right content */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Summary Bar */}
          <SummaryBar
            summary={totalSummary}
            selected={summaryFilter}
            onSelect={handleSummarySelect}
          />

            {/* Active filter chips */}
            {(summaryFilter || !selectedTypes.includes('All') || !selectedGroups.includes('All')) && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {summaryFilter && (
                  <Chip label={`상태: ${summaryFilter}`} onRemove={() => setSummaryFilter(null)} />
                )}
                {!selectedTypes.includes('All') && selectedTypes.map(t => (
                  <Chip key={t} label={`DB: ${t}`} onRemove={() => setSelectedTypes(prev => {
                    const next = prev.filter(x => x !== t)
                    return next.length ? next : ['All']
                  })} />
                ))}
                {!selectedGroups.includes('All') && selectedGroups.map(g => (
                  <Chip key={g} label={`그룹: ${g}`} onRemove={() => setSelectedGroups(prev => {
                    const next = prev.filter(x => x !== g)
                    return next.length ? next : ['All']
                  })} />
                ))}
                <button onClick={() => { setSummaryFilter(null); setSelectedTypes(['All']); setSelectedGroups(['All']) }}
                  style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
                  전체 초기화
                </button>
              </div>
            )}

            {/* Hexagon Grid */}
            <HexagonGrid
              instances={filtered}
              onSelect={setSelectedInstance}
            />

            {/* Instance Table */}
            <InstanceTable
              instances={filtered}
              onSelect={setSelectedInstance}
              selectedId={selectedInstance?.id}
            />
        </div>
      </div>

      {/* Instance Detail Drawer (right side) */}
      {selectedInstance && (
        <InstanceDrawer instance={selectedInstance} onClose={() => setSelectedInstance(null)} />
      )}
    </div>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
      borderRadius: 4, padding: '2px 8px', fontSize: 11,
    }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1d4ed8', fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
    </span>
  )
}

// 인스턴스 데이터 기반으로 메트릭 생성 (실제 cpuUsage/memoryUsage 반영)
function genMetric(inst: DbInstance): DbMetric {
  const variance = (base: number, pct: number) =>
    Math.max(0, base + (Math.random() - 0.5) * base * pct)
  return {
    cpuUsage:      Math.round(variance(inst.cpuUsage, 0.1)),
    memoryUsed:    Math.round(variance(inst.memoryUsage * 163.84, 0.05)), // % → MB (16GB 기준)
    memoryTotal:   16384,
    activeSessions: inst.activeSessionCount,
    totalSessions:  Math.round(inst.activeSessionCount * 6.4),
    lockSessions:   inst.status === 'critical' ? Math.floor(Math.random() * 5) + 1 : 0,
    longSessions:   Math.floor(Math.random() * 8),
    idleSessions:   Math.round(inst.activeSessionCount * 5),
    tps:            Math.round(variance(inst.cpuUsage * 7, 0.2)),
    connectionUsage: Math.round(inst.memoryUsage * 0.9),
    connections:    Math.round(inst.activeSessionCount * 6.4),
    maxConnections: 200,
  }
}

function genSessionDist(inst: DbInstance): SessionDistribution {
  const active = inst.activeSessionCount
  return {
    active,
    idle:  Math.round(active * 5),
    lock:  inst.status === 'critical' ? Math.floor(Math.random() * 4) + 1 : 0,
    long:  Math.floor(Math.random() * 6),
  }
}

function appendPoint(series: TimeSeriesPoint[], value: number): TimeSeriesPoint[] {
  return [...series.slice(-29), { timestamp: Date.now(), value }]
}

function InstanceDrawer({ instance, onClose }: { instance: DbInstance; onClose: () => void }) {
  const [tab, setTab] = useState('정보')
  const [expanded, setExpanded] = useState(false)
  const TABS = ['정보','메트릭','액티브 세션','SQL 목록','Lock 정보','알람','파라미터','호스트 프로세스 목록']

  // 메트릭 상태 (인스턴스 실제 값 기반)
  const [metric, setMetric]           = useState<DbMetric>(() => genMetric(instance))
  const [sessionDist, setSessionDist] = useState<SessionDistribution>(() => genSessionDist(instance))
  const [cpuSeries, setCpuSeries]     = useState<TimeSeriesPoint[]>(mockCpuSeries)
  const [memSeries, setMemSeries]     = useState<TimeSeriesPoint[]>(mockMemSeries)
  const [tpsSeries, setTpsSeries]     = useState<TimeSeriesPoint[]>(mockTpsSeries)
  const [sessionSeries, setSessionSeries] = useState<TimeSeriesPoint[]>(mockSessionSeries)

  // 5초 polling
  useEffect(() => {
    const timer = setInterval(() => {
      const m = genMetric(instance)
      setMetric(m)
      setSessionDist(genSessionDist(instance))
      setCpuSeries(prev => appendPoint(prev, m.cpuUsage))
      setMemSeries(prev => appendPoint(prev, m.memoryUsed))
      setTpsSeries(prev => appendPoint(prev, m.tps))
      setSessionSeries(prev => appendPoint(prev, m.activeSessions))
    }, 5000)
    return () => clearInterval(timer)
  }, [instance])

  // ESC 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.2)', zIndex: 100 }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: expanded ? '95%' : '70%',
        maxWidth: expanded ? 'none' : 900,
        background: '#fff', zIndex: 101, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 20px rgba(0,0,0,.15)',
        transition: 'width 0.2s ease',
      }}>

        {/* Expand / Collapse 버튼 */}
        <div style={{
          position: 'absolute', left: -28, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap: 2, zIndex: 102,
        }}>
          {/* Expand */}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(true) }}
            title="Expand"
            style={{
              width: 28, height: 100,
              background: expanded ? '#e5e7eb' : '#006DFF',
              color: expanded ? '#9ca3af' : '#fff',
              border: 'none', cursor: expanded ? 'default' : 'pointer',
              borderRadius: '6px 0 0 6px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '8px 0', gap: 4,
              transition: 'background 0.15s',
            }}
          >
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: 1,
              writingMode: 'vertical-rl', transform: 'rotate(180deg)',
            }}>{'∧Expand'}</span>
          </button>

          {/* Collapse */}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(false) }}
            title="Collapse"
            style={{
              width: 28, height: 100,
              background: '#006DFF',
              color: expanded ? '#fff' : 'rgba(255,255,255,0.5)',
              border: 'none', cursor: expanded ? 'pointer' : 'default',
              borderRadius: '6px 0 0 6px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '8px 0', gap: 4,
              transition: 'color 0.15s',
            }}
          >
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: 1,
              writingMode: 'vertical-rl', transform: 'rotate(180deg)',
            }}>{'∨Collapse'}</span>
          </button>
        </div>
        {/* Drawer Header */}
        <div style={{
          padding: '12px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#f8f9fa', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>인스턴스: {instance.name}</span>
            <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 4 }}>
              {instance.dbType.toUpperCase()}
            </span>
            {instance.status === 'critical' && (
              <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                ● Critical
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>5초마다 갱신</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)' }}>×</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--tab-bg)', padding: '0 16px', flexShrink: 0, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab === t ? 'var(--tab-active-bg)' : 'transparent',
              border: 'none', cursor: 'pointer', padding: '10px 14px', fontSize: 12,
              color: tab === t ? 'var(--tab-active-text)' : 'var(--tab-text)',
              borderBottom: tab === t ? `2px solid var(--tab-active-border)` : '2px solid transparent',
              fontWeight: tab === t ? 600 : 400, whiteSpace: 'nowrap',
            }}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {tab === '정보' && <InfoTab instance={instance} />}
          {tab === '메트릭' && (
            <DbOverview
              metric={metric}
              sessionDist={sessionDist}
              cpuSeries={cpuSeries}
              memSeries={memSeries}
              tpsSeries={tpsSeries}
              sessionSeries={sessionSeries}
            />
          )}
          {tab === '액티브 세션' && <ActiveSessionTab />}
          {tab === 'SQL 목록' && <SqlTab />}
          {tab === 'Lock 정보' && <LockTreeTab instance={instance} />}
          {tab === '알람' && <AlarmTab />}
          {tab === '파라미터' && <ParameterTab />}
          {tab === '호스트 프로세스 목록' && <HostProcessTab />}
          {!['정보','메트릭','액티브 세션','SQL 목록','Lock 정보','알람','파라미터','호스트 프로세스 목록'].includes(tab) && (
            <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--text-muted)', fontSize: 13 }}>
              {tab} 탭 — 다음 Sprint에서 구현 예정
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Alarm Detail View ─────────────────────────────────────────────
interface AlarmInfo {
  type: string
  ruleBase: string
  checkInterval: number
  checkRepeat: number
  maxOccurrence: string
  controlTime: string
  schedule: string[]
  timezone: string
  timeRange: string
  statName: string
  condition: string
  thresholdWarning: number
  thresholdCritical: number
  unit: string
  tags: string[]
  targets: string[]
}

function getAlarmInfo(alarm: AlarmRule): AlarmInfo {
  const base: AlarmInfo = {
    type: alarm.ruleType === 'Metric' ? '메트릭' : '시스템',
    ruleBase: 'Check by Target',
    checkInterval: 300,
    checkRepeat: 1,
    maxOccurrence: '∞',
    controlTime: '설정 안 함',
    schedule: ['월요일','화요일','수요일','목요일','금요일','토요일','일요일'],
    timezone: '(UTC+09:00) 서울, 오사카, 삿...',
    timeRange: '00:00 ~ 23:59',
    statName: alarm.alertStatName || '-',
    condition: '>',
    thresholdWarning: alarm.threshold?.warning ?? 0,
    thresholdCritical: alarm.threshold?.critical ?? 0,
    unit: '%',
    tags: ['database:*'],
    targets: [
      'database:exemone_metadata','database:cubrid_131','database:MF0251105',
      'database:oracle19','database:mxg_134','database:postgres',
      'database:shinhan_134','database:exemone','database:cubrid_134',
      'database:mxg_131','database:single_test','database:SSH_TEST2','database:SSH_TEST',
    ],
  }
  return base
}

interface AlarmRealtimeRow {
  id: number
  lastAlert: 'Normal' | 'Warning' | 'Critical'
  alertStatName: string
  alertValue: string
  target: string
  firstTriggered: string
  lastTriggered: string
  duration: number
  alias: string
}

function makeRealtimeMock(alarm: AlarmRule): AlarmRealtimeRow[] {
  if (!alarm.threshold) return []
  return [
    {
      id: 1,
      lastAlert: alarm.lastAlert,
      alertStatName: alarm.alertStatName,
      alertValue: alarm.value ? `${alarm.value} %` : '',
      target: alarm.target,
      firstTriggered: '2026-03-17 19:58:00',
      lastTriggered: alarm.lastTriggered || '2026-03-22 17:36:00',
      duration: 423480.037,
      alias: alarm.alias,
    },
  ]
}

const ALARM_DETAIL_FILTER_FIELDS = [
  { id:'alertStatName', label:'Alert Stat Name', operators:['contains','='] },
  { id:'target',        label:'Target',          operators:['contains','='] },
  { id:'lastAlert',     label:'Last Alert',      operators:['='], values:['Normal','Warning','Critical'] },
]

function AlarmInfoTab({ alarm }: { alarm: AlarmRule }) {
  const info = getAlarmInfo(alarm)
  const [notiTab, setNotiTab] = useState<string>('이메일')

  const notiTabs = [
    { id:'이메일',   icon:'✉' },
    { id:'슬랙',     icon:'✛' },
    { id:'텔레그램', icon:'✈' },
    { id:'문자',     icon:'💬' },
    { id:'웹훅',     icon:'⚇' },
    { id:'온사이트', icon:'🔔' },
    { id:'카카오톡', icon:'💛' },
  ]

  const sectionHd: React.CSSProperties = {
    fontSize:13, fontWeight:600, color:'#374151',
    background:'#f3f4f6', padding:'8px 14px',
    borderBottom:'1px solid #e5e7eb', borderTop:'1px solid #e5e7eb',
  }
  const infoRow: React.CSSProperties = {
    display:'flex', alignItems:'flex-start', gap:12,
    padding:'10px 14px', borderBottom:'1px dashed #e5e7eb', fontSize:12,
  }
  const labelS: React.CSSProperties = { color:'#6b7280', minWidth:100, flexShrink:0 }
  const chip: React.CSSProperties = {
    display:'inline-block', padding:'2px 8px', borderRadius:3,
    background:'#f3f4f6', border:'1px solid #e5e7eb', fontSize:11, color:'#374151', marginRight:4, marginBottom:4,
  }

  return (
    <div style={{ flex:1, overflowY:'auto', paddingTop:10 }}>
      {/* ── 룰 데이터 섹션 ── */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:4, marginBottom:16, overflow:'hidden' }}>
        <div style={sectionHd}>룰 데이터</div>

        {/* 메타 정보 */}
        <div style={{ padding:'10px 14px', borderBottom:'1px solid #e5e7eb', fontSize:12, color:'#374151', display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <span>타입 <strong>{info.type}</strong></span>
            <span style={{ color:'#d1d5db' }}>|</span>
            <span>룰 기준
              <span style={{ marginLeft:8, padding:'2px 10px', border:'1px solid #d1d5db', borderRadius:3, background:'#fff', fontSize:11, cursor:'default' }}>{info.ruleBase}</span>
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, color:'#374151' }}>
            <span>체크 주기 <strong>{info.checkInterval}</strong></span>
            <span style={{ color:'#d1d5db' }}>|</span>
            <span>체크 반복 횟수 <strong>{info.checkRepeat}</strong></span>
            <span style={{ color:'#d1d5db' }}>|</span>
            <span>최대 발생 건수 <strong>{info.maxOccurrence}</strong></span>
            <span style={{ color:'#d1d5db' }}>|</span>
            <span>알람 제어 시간 <strong>{info.controlTime}</strong></span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, color:'#374151' }}>
            <span>알림 스케줄</span>
            {info.schedule.map(d => <span key={d} style={{ color:'#374151' }}>{d}</span>)}
            <span style={{ color:'#d1d5db', margin:'0 4px' }}>|</span>
            <span>시간</span>
            <span style={{ color:'#6b7280' }}>{info.timezone}</span>
            <span style={{ color:'#374151' }}>{info.timeRange}</span>
          </div>
        </div>

        {/* 알람 지표 이름 */}
        <div style={infoRow}>
          <span style={labelS}>알람 지표 이름</span>
          <span style={{ color:'#374151' }}>{info.statName}</span>
        </div>

        {/* 실시간 */}
        <div style={infoRow}>
          <span style={labelS}>실시간</span>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ color:'#374151' }}>{info.condition}</span>
            <span style={{ padding:'2px 8px', borderRadius:3, background:'#f59e0b', color:'#fff', fontSize:11, fontWeight:600 }}>Warning</span>
            <span style={{ color:'#374151' }}>{info.thresholdWarning}</span>
            <span style={{ padding:'2px 8px', borderRadius:3, background:'#ef4444', color:'#fff', fontSize:11, fontWeight:600 }}>Critical</span>
            <span style={{ color:'#374151' }}>{info.thresholdCritical}</span>
            <span style={{ color:'#374151' }}>{info.unit}</span>
          </div>
        </div>

        {/* 태그 */}
        <div style={infoRow}>
          <span style={labelS}>태그</span>
          <div>
            {info.tags.map(t => <span key={t} style={chip}>{t}</span>)}
          </div>
        </div>

        {/* 대상 */}
        <div style={{ ...infoRow, borderBottom:'none' }}>
          <span style={labelS}>대상</span>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {info.targets.map(t => <span key={t} style={chip}>{t}</span>)}
          </div>
        </div>
      </div>

      {/* ── 알림 섹션 ── */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:4, overflow:'hidden' }}>
        <div style={sectionHd}>알림</div>

        {/* 알림 서브탭 */}
        <div style={{ display:'flex', borderBottom:'1px solid #e5e7eb', background:'#fff' }}>
          {notiTabs.map(t => (
            <button key={t.id} onClick={() => setNotiTab(t.id)}
              style={{ padding:'8px 14px', fontSize:12, border:'none', borderBottom: notiTab === t.id ? '2px solid #3b82f6' : '2px solid transparent', background:'transparent', color: notiTab === t.id ? '#3b82f6' : '#6b7280', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}
            >
              <span>{t.icon}</span>{t.id}
            </button>
          ))}
        </div>

        {/* 이메일 탭 내용 */}
        {notiTab === '이메일' && (
          <div style={{ padding:'12px 14px', fontSize:12, display:'flex', flexDirection:'column', gap:10 }}>
            <div>
              <span style={{ color:'#6b7280' }}>전송 서버 유형</span>
              <span style={{ marginLeft:8, color:'#374151' }}>(전송 서버)</span>
            </div>
            <div>
              <span style={{ color:'#6b7280' }}>수신 사용자</span>
              <span style={{ marginLeft:8, color:'#374151' }}>(0)</span>
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <span style={{ color:'#6b7280', minWidth:40 }}>내용</span>
              <div style={{ display:'flex', flexDirection:'column', gap:2, color:'#374151' }}>
                <span>$alert$trigger_time$</span>
                <span>$alert$rule_name$</span>
                <span>$alert$targets$</span>
                <span>$alert$alert_name$ : $alert$level$ ($alert$value$)</span>
              </div>
            </div>
          </div>
        )}

        {/* 나머지 알림 탭 placeholder */}
        {notiTab !== '이메일' && (
          <div style={{ padding:'30px 0', textAlign:'center', color:'#9ca3af', fontSize:12 }}>
            {notiTab} 알림 설정 없음
          </div>
        )}
      </div>
    </div>
  )
}

function AlarmDetailView({ alarm, onBack }: { alarm: AlarmRule; onBack: () => void }) {
  const [detailTab, setDetailTab] = useState<'정보' | '실시간' | '과거 이력'>('실시간')
  const [rtPaused, setRtPaused] = useState(false)
  const [rtFilters, setRtFilters] = useState<FilterChip[]>([])
  const [rtFilterMode, setRtFilterMode] = useState<'OR'|'AND'>('OR')
  const [rtSelected, setRtSelected] = useState<Set<number>>(new Set())
  const [rtNow, setRtNow] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
  })

  useEffect(() => {
    if (rtPaused) return
    const id = setInterval(() => {
      const d = new Date()
      setRtNow(`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`)
    }, 1000)
    return () => clearInterval(id)
  }, [rtPaused])

  const rtRows = useMemo(() => {
    const rows = makeRealtimeMock(alarm)
    if (rtFilters.length === 0) return rows
    const check = (r: AlarmRealtimeRow, f: FilterChip) => {
      const val = String((r as any)[f.field] ?? '').toLowerCase()
      const fv = f.value.toLowerCase()
      return f.operator === 'contains' ? val.includes(fv) : val === fv
    }
    return rows.filter(r =>
      rtFilterMode === 'OR' ? rtFilters.some(f => check(r, f)) : rtFilters.every(f => check(r, f))
    )
  }, [alarm, rtFilters, rtFilterMode])

  const alertBadge = (v: 'Normal' | 'Warning' | 'Critical') => {
    if (v === 'Critical') return { background:'#ef4444', color:'#fff', border:'none' }
    if (v === 'Warning')  return { background:'#f59e0b', color:'#fff', border:'none' }
    return { background:'transparent', color:'#16a34a', border:'1px solid #16a34a' }
  }

  const navBtnS: React.CSSProperties = {
    background:'none', border:'1px solid var(--border)', borderRadius:3,
    padding:'2px 6px', cursor:'pointer', color:'var(--text-muted)', fontSize:11,
  }

  const allChecked = rtRows.length > 0 && rtRows.every(r => rtSelected.has(r.id))
  const toggleAll = () => setRtSelected(allChecked ? new Set() : new Set(rtRows.map(r => r.id)))
  const toggleOne = (id: number) => setRtSelected(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* ── 상단 헤더 ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:10, borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:13, padding:'0 4px 0 0' }}>{'<'}</button>
          <span style={{ fontSize:13, color:'var(--text-primary)' }}>
            알람: <strong>{alarm.ruleName}</strong> ({alarm.target})
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button style={{ ...navBtnS, display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:11 }}>⊙</span> 슬라이드 내역
          </button>
          <button onClick={onBack} style={{ ...navBtnS, padding:'2px 8px' }}>✕</button>
        </div>
      </div>

      {/* ── 탭 ── */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        {(['정보','실시간','과거 이력'] as const).map(t => (
          <button key={t} onClick={() => setDetailTab(t)}
            style={{ padding:'8px 16px', fontSize:12, border:'none', borderBottom: detailTab === t ? '2px solid #3b82f6' : '2px solid transparent', background:'transparent', color: detailTab === t ? '#3b82f6' : 'var(--text-muted)', cursor:'pointer', fontWeight: detailTab === t ? 600 : 400 }}
          >{t}</button>
        ))}
      </div>

      {/* ── 정보 탭 ── */}
      {detailTab === '정보' && <AlarmInfoTab alarm={alarm} />}

      {/* ── 실시간 탭 ── */}
      {detailTab === '실시간' && (
        <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden', paddingTop:10 }}>
          {/* 실시간 헤더 */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>실시간 목록</span>
              <span style={{ fontSize:11, color:'var(--text-muted)', cursor:'help' }} title="실시간 알람 목록">?</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              {!rtPaused && (
                <button style={{ padding:'2px 10px', borderRadius:3, border:'1px solid #16a34a', background:'transparent', color:'#16a34a', fontSize:11, cursor:'default', fontWeight:600 }}>Live</button>
              )}
              <span style={{ fontSize:11, color:'var(--text-muted)', fontVariantNumeric:'tabular-nums' }}>{rtNow}</span>
              <button onClick={() => setRtPaused(p => !p)}
                style={{ ...navBtnS, background: rtPaused ? 'rgba(0,109,255,.15)' : 'none', color: rtPaused ? '#006DFF' : 'var(--text-muted)' }}
              >{rtPaused ? '▶' : '⏸'}</button>
              <button style={{ padding:'2px 10px', borderRadius:3, border:'1px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:11, cursor:'pointer' }}>알림 제거</button>
            </div>
          </div>

          {/* 필터 행 */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexShrink:0 }}>
            <select value={rtFilterMode} onChange={e => setRtFilterMode(e.target.value as 'OR'|'AND')}
              style={{ padding:'4px 8px', fontSize:12, border:'1px solid #d1d5db', borderRadius:4, background:'#fff', color:'#374151', cursor:'pointer', height:34, flexShrink:0 }}>
              <option>OR</option>
              <option>AND</option>
            </select>
            <FilterBar
              filters={rtFilters}
              onAdd={chip => setRtFilters(prev => [...prev, chip])}
              onRemove={id => setRtFilters(prev => prev.filter(f => f.id !== id))}
              onClear={() => setRtFilters([])}
              fields={ALARM_DETAIL_FILTER_FIELDS}
            />
            <button style={{ ...navBtnS, marginLeft:'auto', padding:'3px 8px' }}>···</button>
          </div>

          {/* 테이블 */}
          <div style={{ flex:1, overflow:'auto', border:'1px solid #d1d5db', borderRadius:4 }}>
            <table style={{ borderCollapse:'collapse', width:'max-content', minWidth:'100%' }}>
              <thead>
                <tr>
                  <th style={{ padding:'8px 12px', background:'#f9fafb', borderBottom:'1px solid #e5e7eb', width:36 }}>
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor:'#3b82f6' }} />
                  </th>
                  {(['Last Alert','Alert Stat Name','Alert Value','Target','First Triggered','Last Triggered','Duration (sec)','Alias'] as const).map(h => (
                    <th key={h} style={{ padding:'8px 12px', textAlign:'left', background:'#f9fafb', borderBottom:'1px solid #e5e7eb', fontSize:12, fontWeight:600, color:'#374151', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rtRows.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom:'1px solid #e5e7eb', background: i % 2 !== 0 ? 'rgba(0,0,0,.015)' : 'transparent' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,0,0,.04)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 !== 0 ? 'rgba(0,0,0,.015)' : 'transparent' }}
                  >
                    <td style={{ padding:'7px 12px' }}>
                      <input type="checkbox" checked={rtSelected.has(r.id)} onChange={() => toggleOne(r.id)} style={{ accentColor:'#3b82f6' }} />
                    </td>
                    <td style={{ padding:'7px 12px' }}>
                      <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600, ...alertBadge(r.lastAlert) }}>{r.lastAlert}</span>
                    </td>
                    <td style={{ padding:'7px 12px', fontSize:12, color:'#374151' }}>{r.alertStatName}</td>
                    <td style={{ padding:'7px 12px', fontSize:12, color:'#374151' }}>{r.alertValue}</td>
                    <td style={{ padding:'7px 12px', fontSize:12 }}>
                      <span style={{ padding:'2px 8px', borderRadius:3, background:'#f3f4f6', color:'#374151', fontSize:11 }}>{r.target}</span>
                    </td>
                    <td style={{ padding:'7px 12px', fontSize:12, color:'#374151', whiteSpace:'nowrap' }}>{r.firstTriggered}</td>
                    <td style={{ padding:'7px 12px', fontSize:12, color:'#374151', whiteSpace:'nowrap' }}>{r.lastTriggered}</td>
                    <td style={{ padding:'7px 12px', fontSize:12, color:'#374151', textAlign:'right' }}>{r.duration.toLocaleString('en', { minimumFractionDigits:3, maximumFractionDigits:3 })}</td>
                    <td style={{ padding:'7px 12px', fontSize:12, color:'#374151' }}>{r.alias}</td>
                  </tr>
                ))}
                {rtRows.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding:'40px 0', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>실시간 알람이 없습니다</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 과거 이력 탭 ── */}
      {detailTab === '과거 이력' && (
        <div style={{ textAlign:'center', paddingTop:60, color:'var(--text-muted)', fontSize:13 }}>
          과거 이력 탭 — 다음 Sprint에서 구현 예정
        </div>
      )}
    </div>
  )
}

// ── Alarm Tab ─────────────────────────────────────────────────────
interface AlarmRule {
  id: number
  ruleName: string
  alertStatName: string
  target: string
  alias: string
  lastTriggered: string
  ruleType: 'System' | 'Metric'
  lastAlert: 'Normal' | 'Warning' | 'Critical'
  threshold: { text: string; warning: number; critical: number } | null
  value: string
}

const ALARM_MOCK: AlarmRule[] = [
  { id:1, ruleName:'Database:DbDisconnected',                                          alertStatName:'',                  target:'database:MF0251105', alias:'', lastTriggered:'2026-03-22 00:00:12', ruleType:'System', lastAlert:'Normal',   threshold:null,                                                                       value:''       },
  { id:2, ruleName:'Database:AgentDisconnected',                                       alertStatName:'',                  target:'database:MF0251105', alias:'', lastTriggered:'',                    ruleType:'System', lastAlert:'Normal',   threshold:null,                                                                       value:''       },
  { id:3, ruleName:'Database:LazyQueryExecution',                                      alertStatName:'',                  target:'database:MF0251105', alias:'', lastTriggered:'',                    ruleType:'System', lastAlert:'Normal',   threshold:null,                                                                       value:''       },
  { id:4, ruleName:'MEMORY_TEST(SSH)-[exemone_metadata]-[(OS) Memory Used]',           alertStatName:'(OS) Memory Percent',target:'database:MF0251105', alias:'', lastTriggered:'2026-03-22 17:36:00', ruleType:'Metric', lastAlert:'Critical', threshold:{ text:'(OS) Memory Percent 실시간 >',           warning:10, critical:20 }, value:'82.263' },
  { id:5, ruleName:'DB CPU Usage',                                                     alertStatName:'(OS) Cpu Usage',    target:'database:MF0251105', alias:'', lastTriggered:'2026-03-21 00:27:00', ruleType:'Metric', lastAlert:'Normal',   threshold:{ text:'(OS) Cpu Usage 실시간 >=',              warning:80, critical:90 }, value:'10.417' },
  { id:6, ruleName:'DB Memory Usage',                                                  alertStatName:'(OS) Memory Percent',target:'database:MF0251105', alias:'', lastTriggered:'2026-03-21 00:27:00', ruleType:'Metric', lastAlert:'Normal',   threshold:{ text:'(OS) Memory Percent 실시간 >=',         warning:90, critical:95 }, value:'82.274' },
  { id:7, ruleName:'Active Session Count(PostgreSQL)',                                  alertStatName:'Active Backend',    target:'database:MF0251105', alias:'', lastTriggered:'',                    ruleType:'Metric', lastAlert:'Normal',   threshold:{ text:'Active Backend 평균 집계 범위 최근 5 분 >', warning:50, critical:70 }, value:'0'      },
]

const ALARM_FILTER_FIELDS = [
  { id:'ruleName',      label:'Rule Name',       operators:['contains','='] },
  { id:'alertStatName', label:'Alert Stat Name', operators:['contains','='] },
  { id:'target',        label:'Target',          operators:['contains','='] },
  { id:'alias',         label:'Alias',           operators:['contains','='] },
  { id:'ruleType',      label:'Rule Type',       operators:['='],           values:['System','Metric'] },
  { id:'lastAlert',     label:'Last Alert',      operators:['='],           values:['Normal','Warning','Critical'] },
]

function AlarmTab() {
  const [live, setLive] = useState(true)
  const [paused, setPaused] = useState(false)
  const [onlyAlert, setOnlyAlert] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'bar'>('list')
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmRule | null>(null)
  const [filters, setFilters] = useState<FilterChip[]>([])
  const [filterMode, setFilterMode] = useState<'OR'|'AND'>('OR')
  const [now, setNow] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
  })

  useEffect(() => {
    if (!live || paused) return
    const id = setInterval(() => {
      const d = new Date()
      setNow(`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`)
    }, 1000)
    return () => clearInterval(id)
  }, [live, paused])

  const filtered = useMemo(() => {
    let rows = onlyAlert ? ALARM_MOCK.filter(r => r.lastAlert !== 'Normal') : ALARM_MOCK
    if (filters.length === 0) return rows
    const check = (r: AlarmRule, f: FilterChip) => {
      const val = String((r as any)[f.field] ?? '').toLowerCase()
      const fv = f.value.toLowerCase()
      return f.operator === 'contains' ? val.includes(fv) : val === fv
    }
    return rows.filter(r =>
      filterMode === 'OR' ? filters.some(f => check(r, f)) : filters.every(f => check(r, f))
    )
  }, [filters, filterMode, onlyAlert])

  const alertBadge = (v: 'Normal' | 'Warning' | 'Critical') => {
    if (v === 'Critical') return { background:'#ef4444', color:'#fff', border:'none' }
    if (v === 'Warning')  return { background:'#f59e0b', color:'#fff', border:'none' }
    return { background:'transparent', color:'#16a34a', border:'1px solid #16a34a' }
  }

  const navBtnS: React.CSSProperties = {
    background:'none', border:'1px solid var(--border)', borderRadius:3,
    padding:'2px 6px', cursor:'pointer', color:'var(--text-muted)', fontSize:11,
  }

  if (selectedAlarm) {
    return <AlarmDetailView alarm={selectedAlarm} onBack={() => setSelectedAlarm(null)} />
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* ── 헤더 행 ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:8, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>룰 목록</span>
          <span style={{ fontSize:11, color:'var(--text-muted)', cursor:'help' }} title="알람 룰 목록">?</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {!paused && (
            <button
              style={{ padding:'2px 10px', borderRadius:3, border:'1px solid #16a34a', background:'transparent', color:'#16a34a', fontSize:11, cursor:'default', fontWeight:600 }}
            >Live</button>
          )}
          <span style={{ fontSize:11, color:'var(--text-muted)', fontVariantNumeric:'tabular-nums' }}>{now}</span>
          <button
            onClick={() => setPaused(p => !p)}
            style={{ ...navBtnS, background: paused ? 'rgba(0,109,255,.15)' : 'none', color: paused ? '#006DFF' : 'var(--text-muted)' }}
          >{paused ? '▶' : '⏸'}</button>
        </div>
      </div>

      {/* ── 필터 행 ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexShrink:0 }}>
        <select value={filterMode} onChange={e => setFilterMode(e.target.value as 'OR'|'AND')}
          style={{ padding:'4px 8px', fontSize:12, border:'1px solid #d1d5db', borderRadius:4, background:'#fff', color:'#374151', cursor:'pointer', height:34, flexShrink:0 }}>
          <option>OR</option>
          <option>AND</option>
        </select>
        <FilterBar
          filters={filters}
          onAdd={chip => setFilters(prev => [...prev, chip])}
          onRemove={id => setFilters(prev => prev.filter(f => f.id !== id))}
          onClear={() => setFilters([])}
          fields={ALARM_FILTER_FIELDS}
        />
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--text)', cursor:'pointer', whiteSpace:'nowrap' }}>
            <input type="checkbox" checked={onlyAlert} onChange={e => setOnlyAlert(e.target.checked)} style={{ accentColor:'#3b82f6' }} />
            발생 알람만 보기
          </label>
          <div style={{ display:'flex', gap:2 }}>
            {(['list','bar'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                style={{ padding:'3px 8px', borderRadius:3, border:'1px solid var(--border)', background: viewMode === m ? '#3b82f6' : 'var(--surface)', color: viewMode === m ? '#fff' : 'var(--text-muted)', fontSize:11, cursor:'pointer' }}
              >{m === 'list' ? '≡ 목록' : '바'}</button>
            ))}
          </div>
          <button style={{ ...navBtnS, padding:'3px 8px' }}>···</button>
        </div>
      </div>

      {/* ── 바 뷰 placeholder ── */}
      {viewMode === 'bar' ? (
        <div style={{ textAlign:'center', paddingTop:60, color:'var(--text-muted)', fontSize:13 }}>
          바 뷰 — 다음 Sprint에서 구현 예정
        </div>
      ) : (
        /* ── 테이블 ── */
        <div style={{ flex:1, overflow:'auto', border:'1px solid #d1d5db', borderRadius:4 }}>
          <table style={{ borderCollapse:'collapse', width:'max-content', minWidth:'100%' }}>
            <thead>
              <tr>
                {([
                  { label:'Rule Name',       w:320 },
                  { label:'Alert Stat Name', w:160 },
                  { label:'Target',          w:160 },
                  { label:'Alias',           w:100 },
                  { label:'Last Triggered',  w:150 },
                  { label:'Rule Type',       w:90  },
                  { label:'Last Alert',      w:90  },
                  { label:'Threshold',       w:420 },
                  { label:'Value',           w:80  },
                ] as const).map(c => (
                  <th key={c.label} style={{ padding:'8px 12px', textAlign:'left', background:'#f9fafb', borderBottom:'1px solid #e5e7eb', fontSize:12, fontWeight:600, color:'#374151', whiteSpace:'nowrap', minWidth:c.w }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 !== 0 ? 'rgba(0,0,0,.015)' : 'transparent', borderBottom:'1px solid #e5e7eb' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,0,0,.04)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 !== 0 ? 'rgba(0,0,0,.015)' : 'transparent' }}
                >
                  {/* Rule Name */}
                  <td style={{ padding:'7px 12px', fontSize:12 }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                      <span style={{ width:14, height:14, borderRadius:'50%', background:'#3b82f6', color:'#fff', fontSize:9, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>i</span>
                      <button onClick={() => setSelectedAlarm(r)}
                        style={{ background:'none', border:'none', color:'#3b82f6', cursor:'pointer', fontSize:12, textDecoration:'none', padding:0, textAlign:'left' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.textDecoration='underline' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.textDecoration='none' }}
                      >{r.ruleName}</button>
                    </span>
                  </td>
                  {/* Alert Stat Name */}
                  <td style={{ padding:'7px 12px', fontSize:12, color:'#374151' }}>{r.alertStatName}</td>
                  {/* Target */}
                  <td style={{ padding:'7px 12px', fontSize:12, color:'#374151' }}>{r.target}</td>
                  {/* Alias */}
                  <td style={{ padding:'7px 12px', fontSize:12, color:'#374151' }}>{r.alias}</td>
                  {/* Last Triggered */}
                  <td style={{ padding:'7px 12px', fontSize:12, color:'#374151', whiteSpace:'nowrap' }}>{r.lastTriggered}</td>
                  {/* Rule Type */}
                  <td style={{ padding:'7px 12px', fontSize:12, color:'#374151' }}>{r.ruleType}</td>
                  {/* Last Alert */}
                  <td style={{ padding:'7px 12px' }}>
                    <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600, ...alertBadge(r.lastAlert) }}>
                      {r.lastAlert}
                    </span>
                  </td>
                  {/* Threshold */}
                  <td style={{ padding:'7px 12px', fontSize:12, color:'#374151', whiteSpace:'nowrap' }}>
                    {r.threshold && (
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, flexWrap:'nowrap' }}>
                        <span>{r.threshold.text}</span>
                        <span style={{ padding:'1px 6px', borderRadius:3, background:'#f59e0b', color:'#fff', fontSize:11, fontWeight:600 }}>Warning</span>
                        <span style={{ fontSize:12 }}>{r.threshold.warning}</span>
                        <span style={{ padding:'1px 6px', borderRadius:3, background:'#ef4444', color:'#fff', fontSize:11, fontWeight:600 }}>Critical</span>
                        <span style={{ fontSize:12 }}>{r.threshold.critical}</span>
                      </span>
                    )}
                  </td>
                  {/* Value */}
                  <td style={{ padding:'7px 12px', fontSize:12, color:'#374151', textAlign:'right' }}>{r.value}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding:'40px 0', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>발생 알람이 없습니다</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── SQL List Tab ──────────────────────────────────────────────────
interface SqlRow {
  userName: string; sqlId: string; queryId: string; sqlText: string
  calls: number; totalTime: number; sharedBlocksHit: number; localBlocksHit: number
  sharedBlocksRead: number; localBlocksRead: number; tempBlocks: number
  maxExecution: number; minExecution: number; databaseName: string
  tempBlocksRead: number; sharedBlocksWritten: number; localBlocksWritten: number
}

const SQL_MOCK: SqlRow[] = [
  { userName:'postgres', sqlId:'8093eda369fe83d...', queryId:'-341635644204...', sqlText:'SELECT pg_sleep(5)', calls:589, totalTime:5.028, sharedBlocksHit:0, localBlocksHit:0, sharedBlocksRead:0, localBlocksRead:0, tempBlocks:0, maxExecution:15.014, minExecution:5, databaseName:'postgres', tempBlocksRead:0, sharedBlocksWritten:0, localBlocksWritten:0 },
  { userName:'postgres', sqlId:'1c3bbb955eab473...', queryId:'9064512727571901563', sqlText:"SELECT COUNT(*) FROM ingredient WHERE value2='Pineapple'", calls:4921, totalTime:372.061, sharedBlocksHit:63874580, localBlocksHit:0, sharedBlocksRead:0, localBlocksRead:0, tempBlocks:0, maxExecution:1.6, minExecution:0.002, databaseName:'postgres', tempBlocksRead:0, sharedBlocksWritten:0, localBlocksWritten:0 },
  { userName:'postgres', sqlId:'54ea88ba4c3ee39...', queryId:'4749528913698893325', sqlText:"SELECT COUNT(*) FROM ingredient WHERE value1='Joshua'", calls:4892, totalTime:371.129, sharedBlocksHit:63498160, localBlocksHit:0, sharedBlocksRead:0, localBlocksRead:0, tempBlocks:0, maxExecution:1.811, minExecution:0.002, databaseName:'postgres', tempBlocksRead:0, sharedBlocksWritten:0, localBlocksWritten:0 },
  { userName:'postgres', sqlId:'e8338d1ff25204d...', queryId:'-7076833459050361548', sqlText:"SELECT COUNT(*) FROM ingredient WHERE value3='Australia'", calls:4868, totalTime:370.427, sharedBlocksHit:63186640, localBlocksHit:0, sharedBlocksRead:0, localBlocksRead:0, tempBlocks:0, maxExecution:2.063, minExecution:0.002, databaseName:'postgres', tempBlocksRead:0, sharedBlocksWritten:0, localBlocksWritten:0 },
  { userName:'postgres', sqlId:'d911ab7e631d16b...', queryId:'4168231368219757...', sqlText:'SELECT COUNT(*) FROM ingredient WHERE value5=$1', calls:4811, totalTime:362.14, sharedBlocksHit:62446780, localBlocksHit:0, sharedBlocksRead:0, localBlocksRead:0, tempBlocks:0, maxExecution:1.5, minExecution:0.002, databaseName:'postgres', tempBlocksRead:0, sharedBlocksWritten:0, localBlocksWritten:0 },
  { userName:'postgres', sqlId:'09301c577b84795...', queryId:'-9035002112214883...', sqlText:"SELECT COUNT(*) FROM ingredient WHERE value4='Blue'", calls:4809, totalTime:364.384, sharedBlocksHit:62420820, localBlocksHit:0, sharedBlocksRead:0, localBlocksRead:0, tempBlocks:0, maxExecution:1.602, minExecution:0.002, databaseName:'postgres', tempBlocksRead:0, sharedBlocksWritten:0, localBlocksWritten:0 },
  { userName:'postgres', sqlId:'23838c7da8c92fb...', queryId:'6564320877880568475', sqlText:'UPDATE ingredient SET value4 = $1 WHERE id = $2', calls:3377, totalTime:265.908, sharedBlocksHit:43840345, localBlocksHit:0, sharedBlocksRead:0, localBlocksRead:0, tempBlocks:0, maxExecution:4.903, minExecution:0.002, databaseName:'postgres', tempBlocksRead:0, sharedBlocksWritten:0, localBlocksWritten:0 },
  { userName:'postgres', sqlId:'9b4c36411536b6f...', queryId:'2547316128752658...', sqlText:"UPDATE ingredient SET value2 = 'Peach' WHERE id = '67'", calls:3359, totalTime:257.327, sharedBlocksHit:43606667, localBlocksHit:0, sharedBlocksRead:0, localBlocksRead:0, tempBlocks:0, maxExecution:1.89, minExecution:0.002, databaseName:'postgres', tempBlocksRead:0, sharedBlocksWritten:0, localBlocksWritten:0 },
  { userName:'postgres', sqlId:'6731dffda221ef0...', queryId:'1829190345762374173', sqlText:'UPDATE ingredient SET value1 = $1 WHERE id = $2', calls:3340, totalTime:257.293, sharedBlocksHit:43360038, localBlocksHit:0, sharedBlocksRead:0, localBlocksRead:0, tempBlocks:0, maxExecution:1.893, minExecution:0.002, databaseName:'postgres', tempBlocksRead:0, sharedBlocksWritten:0, localBlocksWritten:0 },
  { userName:'postgres', sqlId:'6df754128d769c9...', queryId:'8791867689727599603', sqlText:'UPDATE ingredient SET value5 = $1 WHERE id = $2', calls:3309, totalTime:250.213, sharedBlocksHit:42957545, localBlocksHit:0, sharedBlocksRead:0, localBlocksRead:0, tempBlocks:0, maxExecution:4.0, minExecution:0.002, databaseName:'postgres', tempBlocksRead:0, sharedBlocksWritten:0, localBlocksWritten:0 },
  { userName:'postgres', sqlId:'5b70687597a6233...', queryId:'2343501929299798418', sqlText:"UPDATE ingredient SET value3 = 'India' WHERE id = '484'", calls:3295, totalTime:251.059, sharedBlocksHit:42775803, localBlocksHit:0, sharedBlocksRead:0, localBlocksRead:0, tempBlocks:0, maxExecution:4.1, minExecution:0.002, databaseName:'postgres', tempBlocksRead:0, sharedBlocksWritten:0, localBlocksWritten:0 },
  { userName:'postgres', sqlId:'364f12a682302dc...', queryId:'-4280619648719976988', sqlText:"SELECT COUNT(*) FROM ingredient_lock WHERE value2='Banana'", calls:15692, totalTime:5.999, sharedBlocksHit:141228, localBlocksHit:0, sharedBlocksRead:0, localBlocksRead:0, tempBlocks:0, maxExecution:0.09, minExecution:0.0, databaseName:'postgres', tempBlocksRead:0, sharedBlocksWritten:0, localBlocksWritten:0 },
  { userName:'postgres', sqlId:'d9f660425a04547...', queryId:'8591507293133126744', sqlText:"SELECT COUNT(*) FROM ingredient_lock WHERE value3='Australia'", calls:15612, totalTime:6.874, sharedBlocksHit:140508, localBlocksHit:0, sharedBlocksRead:0, localBlocksRead:0, tempBlocks:0, maxExecution:0.08, minExecution:0.0, databaseName:'postgres', tempBlocksRead:0, sharedBlocksWritten:0, localBlocksWritten:0 },
  { userName:'postgres', sqlId:'a0cfc27420e97fd...', queryId:'-1894166640673637499', sqlText:"SELECT COUNT(*) FROM ingredient_lock WHERE value1='Numbers'", calls:15536, totalTime:5.818, sharedBlocksHit:139824, localBlocksHit:0, sharedBlocksRead:0, localBlocksRead:0, tempBlocks:0, maxExecution:0.07, minExecution:0.0, databaseName:'postgres', tempBlocksRead:0, sharedBlocksWritten:0, localBlocksWritten:0 },
  { userName:'postgres', sqlId:'519ffdec0b5f9fb...', queryId:'4074638550352357163', sqlText:"SELECT COUNT(*) FROM ingredient_lock WHERE value4='Brown'", calls:15508, totalTime:6.395, sharedBlocksHit:139572, localBlocksHit:0, sharedBlocksRead:0, localBlocksRead:0, tempBlocks:0, maxExecution:0.085, minExecution:0.0, databaseName:'postgres', tempBlocksRead:0, sharedBlocksWritten:0, localBlocksWritten:0 },
]

const SQL_KW = new Set(['SELECT','FROM','WHERE','UPDATE','SET','INSERT','INTO','DELETE','VALUES','COUNT','AND','OR','LIMIT','JOIN','ON','GROUP','BY','ORDER','HAVING','DISTINCT','AS','NOT','IN','IS','NULL','LIKE','BETWEEN','CASE','WHEN','THEN','ELSE','END','LEFT','RIGHT','INNER','OUTER','FULL','WITH','RETURNING'])

function SqlHighlight({ sql }: { sql: string }) {
  const tokens: React.ReactNode[] = []
  let rest = sql, k = 0
  while (rest.length > 0) {
    const str = rest.match(/^'[^']*'/)
    if (str) { tokens.push(<span key={k++} style={{ color:'#d97706' }}>{str[0]}</span>); rest = rest.slice(str[0].length); continue }
    const param = rest.match(/^\$\d+/)
    if (param) { tokens.push(<span key={k++} style={{ color:'#7c3aed' }}>{param[0]}</span>); rest = rest.slice(param[0].length); continue }
    const word = rest.match(/^[A-Za-z_]\w*/)
    if (word) {
      const w = word[0]
      tokens.push(SQL_KW.has(w.toUpperCase())
        ? <span key={k++} style={{ color:'#1d4ed8', fontWeight:600 }}>{w}</span>
        : <span key={k++}>{w}</span>)
      rest = rest.slice(w.length); continue
    }
    tokens.push(<span key={k++}>{rest[0]}</span>); rest = rest.slice(1)
  }
  return <>{tokens}</>
}

function SqlFullTextModal({ sql, onClose }: { sql: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const [formatted, setFormatted] = useState(false)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const displaySql = formatted
    ? sql.replace(/\b(SELECT|FROM|WHERE|UPDATE|SET|INSERT|INTO|DELETE|VALUES|JOIN|AND|OR|ORDER BY|GROUP BY|HAVING|LIMIT)\b/gi, '\n$1').trim()
    : sql

  const lines = displaySql.split('\n')

  const handleCopy = () => {
    navigator.clipboard?.writeText(sql).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:700 }} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        zIndex:701, width:680, background:'#fff', borderRadius:6,
        boxShadow:'0 8px 32px rgba(0,0,0,.28)', display:'flex', flexDirection:'column',
      }}>
        {/* header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid #e5e7eb' }}>
          <span style={{ fontSize:14, fontWeight:700, color:'#111' }}>SQL Full Text</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#9ca3af', lineHeight:1 }}>×</button>
        </div>
        {/* body */}
        <div style={{ position:'relative', margin:12, border:'1px solid #e5e7eb', borderRadius:4, minHeight:180, background:'#fafafa' }}>
          {/* copy button */}
          <button
            onClick={handleCopy}
            title="Copy"
            style={{ position:'absolute', top:8, right:8, background:'none', border:'1px solid #d1d5db', borderRadius:4, cursor:'pointer', padding:'3px 7px', fontSize:11, color: copied ? '#059669' : '#6b7280' }}
          >{copied ? '✓' : '⧉'}</button>
          {/* code area */}
          <div style={{ padding:'12px 8px 12px 0', overflowX:'auto' }}>
            {lines.map((line, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', lineHeight:'22px' }}>
                <span style={{ minWidth:32, textAlign:'right', paddingRight:12, color:'#9ca3af', fontSize:12, userSelect:'none', flexShrink:0 }}>{i+1}</span>
                <span style={{ borderLeft:'2px solid #dbeafe', paddingLeft:12, fontSize:13, fontFamily:'monospace', whiteSpace:'pre-wrap', wordBreak:'break-all' }}>
                  <SqlHighlight sql={line} />
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* footer */}
        <div style={{ padding:'10px 16px', borderTop:'1px solid #e5e7eb', display:'flex', alignItems:'center' }}>
          <button
            onClick={() => setFormatted(f => !f)}
            style={{ padding:'6px 14px', fontSize:12, borderRadius:4, border:'none', background:'#006DFF', color:'#fff', fontWeight:600, cursor:'pointer' }}
          >{formatted ? 'Original' : 'Format SQL'}</button>
        </div>
      </div>
    </>
  )
}

// ─── SQL Detail View ─────────────────────────────────────────────────────────
function SqlDetailView({ row, onBack }: { row: SqlRow; onBack: () => void }) {
  const [tab, setTab] = useState<'fulltext'|'trend'|'history'|'plan'|'sampling'>('fulltext')

  const tabs = [
    { key: 'fulltext' as const, label: 'Full Text' },
    { key: 'trend'    as const, label: '추이' },
    { key: 'history'  as const, label: '과거 이력' },
    { key: 'plan'     as const, label: 'Plan' },
    { key: 'sampling' as const, label: 'Sampling SQL Text' },
  ]

  const tabBtnS = (k: string): React.CSSProperties => ({
    padding: '6px 14px', fontSize: 12, fontWeight: tab === k ? 700 : 400,
    color: tab === k ? '#006DFF' : '#6b7280',
    background: 'none', border: 'none',
    borderBottom: tab === k ? '2px solid #006DFF' : '2px solid transparent',
    cursor: 'pointer', whiteSpace: 'nowrap',
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:0 }}>
      {/* header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, paddingBottom:10, borderBottom:'1px solid var(--border)', marginBottom:0, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#374151', padding:'0 4px', lineHeight:1 }}>‹</button>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>SQL Detail</span>
        <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'monospace' }}>{row.sqlId}</span>
      </div>
      {/* tab bar */}
      <div style={{ display:'flex', borderBottom:'1px solid #e5e7eb', flexShrink:0 }}>
        {tabs.map(t => <button key={t.key} onClick={() => setTab(t.key)} style={tabBtnS(t.key)}>{t.label}</button>)}
      </div>
      {/* content */}
      <div style={{ flex:1, overflow:'auto', padding:'12px 0 0' }}>
        {tab === 'fulltext'  && <SqlDetailFullText sql={row.sqlText} />}
        {tab === 'trend'     && <SqlDetailTrend row={row} />}
        {tab === 'history'   && <SqlDetailHistory row={row} />}
        {tab === 'plan'      && <SqlDetailPlan />}
        {tab === 'sampling'  && <SqlDetailFullText sql={row.sqlText} />}
      </div>
    </div>
  )
}

function SqlDetailFullText({ sql }: { sql: string }) {
  const [copied, setCopied] = useState(false)
  const [formatted, setFormatted] = useState(false)

  const displaySql = formatted
    ? sql.replace(/\b(SELECT|FROM|WHERE|UPDATE|SET|INSERT|INTO|DELETE|VALUES|JOIN|AND|OR|ORDER BY|GROUP BY|HAVING|LIMIT)\b/gi, '\n$1').trim()
    : sql
  const lines = displaySql.split('\n')

  const handleCopy = () => {
    navigator.clipboard?.writeText(sql).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={() => setFormatted(f => !f)}
          style={{ padding:'5px 12px', fontSize:12, borderRadius:4, border:'none', background:'#006DFF', color:'#fff', fontWeight:600, cursor:'pointer' }}>
          {formatted ? 'Original' : 'Formatting'}
        </button>
        <button onClick={handleCopy}
          style={{ padding:'5px 10px', fontSize:12, borderRadius:4, border:'1px solid #d1d5db', background:'#fff', color: copied ? '#059669' : '#374151', cursor:'pointer' }}>
          {copied ? '✓ Copied' : '⧉ Copy'}
        </button>
      </div>
      <div style={{ border:'1px solid #e5e7eb', borderRadius:4, background:'#fafafa', padding:'12px 8px 12px 0', overflowX:'auto' }}>
        {lines.map((line, i) => (
          <div key={i} style={{ display:'flex', alignItems:'flex-start', lineHeight:'22px' }}>
            <span style={{ minWidth:32, textAlign:'right', paddingRight:12, color:'#9ca3af', fontSize:12, userSelect:'none' as const, flexShrink:0 }}>{i+1}</span>
            <span style={{ borderLeft:'2px solid #dbeafe', paddingLeft:12, fontSize:13, fontFamily:'monospace', whiteSpace:'pre-wrap', wordBreak:'break-all' }}>
              <SqlHighlight sql={line} />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SqlDetailTrend({ row }: { row: SqlRow }) {
  const [timeRange, setTimeRange] = useState<TimeRange>(TIME_RANGES[1])
  const [paused, setPaused] = useState(false)
  const [pausedAt, setPausedAt] = useState<Date | undefined>(undefined)

  const navBtnS: React.CSSProperties = {
    background:'none', border:'1px solid var(--border)', borderRadius:3,
    padding:'2px 6px', cursor:'pointer', color:'var(--text-muted)', fontSize:11,
  }

  const pts = 20
  const now = Date.now()
  const step = timeRange.ms / pts
  const times = Array.from({ length: pts }, (_, i) => {
    const t = new Date(now - timeRange.ms + i * step)
    return `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`
  })

  const sc = row.totalTime / 100
  const trendData = useMemo(() => ({
    execTime:   times.map((_, i) => +(sc * (0.8 + Math.random() * 0.4) * (i % 5 === 3 ? 2.5 : 1)).toFixed(3)),
    totalTime:  times.map(()    => +(sc * 5 * (0.9 + Math.random() * 0.2)).toFixed(1)),
    sharedHit:  times.map(()    => Math.round(row.sharedBlocksHit / pts * (0.8 + Math.random() * 0.4))),
    sharedRead: times.map(()    => Math.round((row.sharedBlocksRead || 1) * (0.5 + Math.random()))),
    calls:      times.map(()    => Math.round(row.calls / pts * (0.8 + Math.random() * 0.4))),
    executions: times.map(()    => Math.round(row.calls / pts * (0.7 + Math.random() * 0.6))),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [row, timeRange])

  const chartOpt = (seriesList: { name: string; data: number[]; color: string }[], yUnit = '') => ({
    animation: false,
    grid: { top:28, right:10, bottom:30, left:55 },
    xAxis: { type:'category', data: times, axisLabel: { fontSize:10 } },
    yAxis: { type:'value', axisLabel: { fontSize:10, formatter: (v: number) => v + yUnit } },
    tooltip: { trigger:'axis', textStyle:{ fontSize:11 } },
    legend: { top:4, right:8, textStyle:{ fontSize:10 } },
    series: seriesList.map(s => ({
      name: s.name, type:'line', data: s.data, smooth:true, symbol:'none',
      lineStyle:{ color: s.color, width:2 }, itemStyle:{ color: s.color },
    })),
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
        <TimeRangePicker selected={timeRange} onSelect={setTimeRange} paused={paused} pausedAt={pausedAt} />
        <div style={{ display:'flex', gap:2 }}>
          <button style={navBtnS}>◀◀</button>
          <button onClick={() => { setPaused(p => { if (!p) setPausedAt(new Date()); return !p }) }}
            style={{ ...navBtnS, background: paused ? 'rgba(0,109,255,.15)' : 'none', color: paused ? '#006DFF' : 'var(--text-muted)' }}
          >{paused ? '▶' : '⏸'}</button>
          <button style={navBtnS}>▶▶</button>
        </div>
      </div>
      <div style={{ border:'1px solid #e5e7eb', borderRadius:4, padding:'8px 0 0' }}>
        <div style={{ fontSize:11, fontWeight:600, color:'#374151', paddingLeft:12, marginBottom:2 }}>Time / Total Time</div>
        <ReactECharts option={chartOpt([
          { name:'Exec Time (avg)', data: trendData.execTime,  color:'#3b82f6' },
          { name:'Total Time',      data: trendData.totalTime, color:'#f59e0b' },
        ], 'ms')} style={{ height:160 }} />
      </div>
      <div style={{ border:'1px solid #e5e7eb', borderRadius:4, padding:'8px 0 0' }}>
        <div style={{ fontSize:11, fontWeight:600, color:'#374151', paddingLeft:12, marginBottom:2 }}>I/O / Shared Blocks</div>
        <ReactECharts option={chartOpt([
          { name:'Shared Blocks Hit',  data: trendData.sharedHit,  color:'#10b981' },
          { name:'Shared Blocks Read', data: trendData.sharedRead, color:'#ef4444' },
        ])} style={{ height:160 }} />
      </div>
      <div style={{ border:'1px solid #e5e7eb', borderRadius:4, padding:'8px 0 0' }}>
        <div style={{ fontSize:11, fontWeight:600, color:'#374151', paddingLeft:12, marginBottom:2 }}>Executions / Calls</div>
        <ReactECharts option={chartOpt([
          { name:'Calls',      data: trendData.calls,      color:'#8b5cf6' },
          { name:'Executions', data: trendData.executions, color:'#f97316' },
        ])} style={{ height:160 }} />
      </div>
    </div>
  )
}

type HistColDef = { key: string; label: string; w: number; red?: boolean; right?: boolean }

const HIST_COLS_SUM: HistColDef[] = [
  { key:'time',                label:'Time',                  w:130 },
  { key:'calls',               label:'Calls',                 w:70,  right:true },
  { key:'totalTime',           label:'Total Time',            w:100, red:true, right:true },
  { key:'sharedBlocksHit',     label:'Shared Blocks Hit',    w:130, red:true, right:true },
  { key:'localBlocksHit',      label:'Local Blocks Hit',     w:120, right:true },
  { key:'sharedBlocksRead',    label:'Shared Blocks Read',   w:130, right:true },
  { key:'localBlocksRead',     label:'Local Blocks Read',    w:120, right:true },
  { key:'tempBlocksRead',      label:'Temp Blocks Read',     w:120, right:true },
  { key:'sharedBlocksWritten', label:'Shared Blocks Written',w:150, red:true, right:true },
  { key:'localBlocksWritten',  label:'Local Blocks Written', w:140, right:true },
  { key:'tempBlocksWritten',   label:'Temp Blocks Written',  w:140, right:true },
  { key:'rows',                label:'Rows',                 w:80,  right:true },
  { key:'blockReadTime',       label:'Block Read Time',      w:120, right:true },
  { key:'blockWriteTime',      label:'Block Write Time',     w:120, right:true },
]
const HIST_COLS_AVG: HistColDef[] = HIST_COLS_SUM.map(c =>
  c.key === 'time' ? c : { ...c, label: c.label + ' (avg)' }
)

interface HistRow {
  time: string; calls: number; totalTime: number; sharedBlocksHit: number
  localBlocksHit: number; sharedBlocksRead: number; localBlocksRead: number
  tempBlocksRead: number; sharedBlocksWritten: number; localBlocksWritten: number
  tempBlocksWritten: number; rows: number; blockReadTime: number; blockWriteTime: number
}

function genHistRows(row: SqlRow): HistRow[] {
  return Array.from({ length: 10 }, (_, i) => {
    const t = new Date(Date.now() - (9 - i) * 10 * 60_000)
    const s = 0.8 + Math.random() * 0.4
    return {
      time: t.toLocaleString('ko-KR', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' }),
      calls:               Math.round(row.calls / 10 * s),
      totalTime:           Math.round(row.totalTime / 10 * s * 100) / 100,
      sharedBlocksHit:     Math.round(row.sharedBlocksHit / 10 * s),
      localBlocksHit:      Math.round(row.localBlocksHit / 10 * s),
      sharedBlocksRead:    Math.round((row.sharedBlocksRead || 0) / 10 * s),
      localBlocksRead:     Math.round(row.localBlocksRead / 10 * s),
      tempBlocksRead:      Math.round(row.tempBlocksRead / 10 * s),
      sharedBlocksWritten: Math.round(row.sharedBlocksWritten / 10 * s),
      localBlocksWritten:  Math.round(row.localBlocksWritten / 10 * s),
      tempBlocksWritten:   Math.round(Math.random() * 10),
      rows:                Math.round(row.calls / 10 * s),
      blockReadTime:       Math.round(Math.random() * 50 * 100) / 100,
      blockWriteTime:      Math.round(Math.random() * 20 * 100) / 100,
    }
  })
}

function SqlDetailHistory({ row }: { row: SqlRow }) {
  const [viewMode, setViewMode] = useState<'sum'|'avg'>('sum')
  const [filters, setFilters] = useState<FilterChip[]>([])
  const [filterMode, setFilterMode] = useState<'OR'|'AND'>('OR')
  const histRows = useMemo(() => genHistRows(row), [row])

  const avgRows: HistRow[] = useMemo(() => histRows.map(r => ({
    ...r,
    totalTime:           r.calls ? Math.round(r.totalTime / r.calls * 10000) / 10000 : 0,
    sharedBlocksHit:     r.calls ? Math.round(r.sharedBlocksHit / r.calls) : 0,
    localBlocksHit:      r.calls ? Math.round(r.localBlocksHit / r.calls) : 0,
    sharedBlocksRead:    r.calls ? Math.round(r.sharedBlocksRead / r.calls) : 0,
    localBlocksRead:     r.calls ? Math.round(r.localBlocksRead / r.calls) : 0,
    tempBlocksRead:      r.calls ? Math.round(r.tempBlocksRead / r.calls) : 0,
    sharedBlocksWritten: r.calls ? Math.round(r.sharedBlocksWritten / r.calls) : 0,
    localBlocksWritten:  r.calls ? Math.round(r.localBlocksWritten / r.calls) : 0,
    tempBlocksWritten:   r.calls ? Math.round(r.tempBlocksWritten / r.calls) : 0,
    rows:                r.calls ? Math.round(r.rows / r.calls) : 0,
    blockReadTime:       r.calls ? Math.round(r.blockReadTime / r.calls * 10000) / 10000 : 0,
    blockWriteTime:      r.calls ? Math.round(r.blockWriteTime / r.calls * 10000) / 10000 : 0,
  })), [histRows])

  const applyF = (r: HistRow, f: FilterChip) => {
    const val  = String((r as any)[f.fieldKey] ?? '').toLowerCase()
    const fval = f.value.toLowerCase()
    switch (f.operator) {
      case '==': return val === fval
      case '!=': return val !== fval
      case 'like': return val.includes(fval)
      case 'not like': return !val.includes(fval)
      default: return true
    }
  }

  const baseRows = viewMode === 'sum' ? histRows : avgRows
  const displayed = filters.length === 0 ? baseRows
    : filterMode === 'OR' ? baseRows.filter(r => filters.some(f => applyF(r, f)))
    : baseRows.filter(r => filters.every(f => applyF(r, f)))
  const cols = viewMode === 'sum' ? HIST_COLS_SUM : HIST_COLS_AVG

  const thS: React.CSSProperties = {
    padding:'7px 8px', fontSize:11, fontWeight:600, color:'#374151', background:'#e8eaed',
    borderBottom:'1px solid #d1d5db', borderRight:'1px solid #d1d5db',
    whiteSpace:'nowrap', position:'sticky', top:0, zIndex:1,
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <select value={filterMode} onChange={e => setFilterMode(e.target.value as 'OR'|'AND')}
          style={{ padding:'4px 8px', fontSize:12, border:'1px solid #d1d5db', borderRadius:4, background:'#fff', color:'#374151', cursor:'pointer', height:34, flexShrink:0 }}>
          <option>OR</option>
          <option>AND</option>
        </select>
        <FilterBar
          filters={filters}
          onAdd={chip => setFilters(prev => [...prev, chip])}
          onRemove={id => setFilters(prev => prev.filter(f => f.id !== id))}
          onClear={() => setFilters([])}
        />
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <span style={{ fontSize:11, fontWeight:600, color:'#059669' }}>Sum</span>
          <div onClick={() => setViewMode(v => v === 'sum' ? 'avg' : 'sum')}
            style={{ width:34, height:18, borderRadius:9, cursor:'pointer', position:'relative',
              background: viewMode === 'sum' ? '#059669' : '#dc2626', transition:'background .2s' }}>
            <div style={{ position:'absolute', top:2, width:14, height:14, borderRadius:'50%', background:'#fff',
              transition:'left .2s', left: viewMode === 'sum' ? 2 : 18, boxShadow:'0 1px 3px rgba(0,0,0,.3)' }} />
          </div>
          <span style={{ fontSize:11, fontWeight:600, color:'#dc2626' }}>Avg</span>
        </div>
      </div>
      <div style={{ flex:1, overflow:'auto', border:'1px solid #d1d5db', borderRadius:4 }}>
        <table style={{ borderCollapse:'collapse', width:'max-content', minWidth:'100%' }}>
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.key} style={{ ...thS, minWidth:c.w, textAlign: c.right ? 'right' : 'center',
                  color: c.red ? (viewMode === 'sum' ? '#059669' : '#dc2626') : '#374151' }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((r, i) => (
              <tr key={i}
                style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.015)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,0,0,.04)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.015)' }}
              >
                {cols.map(c => {
                  const raw = (r as any)[c.key]
                  const val = typeof raw === 'number' ? raw.toLocaleString() : String(raw ?? '')
                  return (
                    <td key={c.key} style={{
                      padding:'6px 8px', fontSize:11, color:'#111827',
                      borderBottom:'1px solid #e5e7eb', borderRight:'1px solid #e5e7eb',
                      whiteSpace:'nowrap', textAlign: c.right ? 'right' : 'left',
                    }}>{val}</td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const MOCK_PLAN_LINES = [
  'Seq Scan on ingredient  (cost=0.00..279408.20 rows=1 width=147) (actual time=0.023..2894.073 rows=1 loops=1)',
  '  Filter: ((value2)::text = \'Pineapple\'::text)',
  '  Rows Removed by Filter: 14000009',
  'Planning Time: 0.082 ms',
  'Execution Time: 2894.085 ms',
]

function SqlDetailPlan() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div>
        <button style={{ padding:'5px 12px', fontSize:12, borderRadius:4, border:'1px solid #d1d5db', background:'#fff', color:'#374151', cursor:'pointer', fontWeight:600 }}>
          Default Plan
        </button>
      </div>
      <div style={{ border:'1px solid #d1d5db', borderRadius:4, overflow:'auto' }}>
        <table style={{ borderCollapse:'collapse', width:'100%' }}>
          <thead>
            <tr>
              <th style={{ padding:'7px 12px', fontSize:11, fontWeight:600, color:'#374151', background:'#e8eaed', borderBottom:'1px solid #d1d5db', borderRight:'1px solid #d1d5db', textAlign:'center', width:40 }}>#</th>
              <th style={{ padding:'7px 12px', fontSize:11, fontWeight:600, color:'#374151', background:'#e8eaed', borderBottom:'1px solid #d1d5db', textAlign:'left' }}>Query Plan</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PLAN_LINES.map((line, i) => (
              <tr key={i}
                style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.015)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,0,0,.04)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.015)' }}
              >
                <td style={{ padding:'6px 12px', fontSize:11, color:'#6b7280', borderBottom:'1px solid #e5e7eb', borderRight:'1px solid #e5e7eb', textAlign:'center', whiteSpace:'nowrap' }}>{i+1}</td>
                <td style={{ padding:'6px 12px', fontSize:11, color:'#111827', borderBottom:'1px solid #e5e7eb', fontFamily:'monospace', whiteSpace:'pre' }}>{line}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// 기준 시간(10m)대비 배율
function sqlScale(ms: number) { return ms / (10 * 60_000) }

function SqlTab() {
  const [viewMode, setViewMode]     = useState<'sum'|'avg'>('sum')
  const [filters, setFilters]       = useState<FilterChip[]>([])
  const [filterMode, setFilterMode] = useState<'OR'|'AND'>('OR')
  const [timeRange, setTimeRange]   = useState<TimeRange>(TIME_RANGES[1])  // 10m
  const [paused, setPaused]         = useState(false)
  const [pausedAt, setPausedAt]     = useState<Date | undefined>(undefined)
  const [fullText, setFullText]     = useState<string|null>(null)
  const [selectedRow, setSelectedRow] = useState<SqlRow | null>(null)

  const scale = sqlScale(timeRange.ms)

  // 시간 범위에 따라 수치 스케일 적용
  const scaledMock = useMemo(() => SQL_MOCK.map(r => ({
    ...r,
    calls:             Math.round(r.calls * scale),
    totalTime:         Math.round(r.totalTime * scale * 1000) / 1000,
    sharedBlocksHit:   Math.round(r.sharedBlocksHit * scale),
    localBlocksHit:    Math.round(r.localBlocksHit * scale),
    sharedBlocksRead:  Math.round(r.sharedBlocksRead * scale),
    localBlocksRead:   Math.round(r.localBlocksRead * scale),
    tempBlocks:        Math.round(r.tempBlocks * scale),
    sharedBlocksWritten: Math.round(r.sharedBlocksWritten * scale),
    localBlocksWritten:  Math.round(r.localBlocksWritten * scale),
  })), [scale])

  // Sum 모드 정렬: totalTime 내림차순 / Avg 모드: maxExecution 내림차순
  const rows = useMemo(() =>
    [...scaledMock].sort((a, b) => viewMode === 'sum' ? b.totalTime - a.totalTime : b.maxExecution - a.maxExecution),
  [scaledMock, viewMode])

  const applyF = (r: SqlRow, f: FilterChip) => {
    const val  = String((r as any)[f.fieldKey] ?? '').toLowerCase()
    const fval = f.value.toLowerCase()
    switch (f.operator) {
      case '==': return val === fval
      case '!=': return val !== fval
      case 'like': return val.includes(fval)
      case 'not like': return !val.includes(fval)
      default: return true
    }
  }
  const displayed = filters.length === 0 ? rows
    : filterMode === 'OR' ? rows.filter(r => filters.some(f => applyF(r, f)))
    : rows.filter(r => filters.every(f => applyF(r, f)))

  // 컬럼 정의
  type ColDef = { key: string; label: string; w: number; red?: boolean; right?: boolean }
  const sumCols: ColDef[] = [
    { key:'userName',        label:'User Name',           w:88  },
    { key:'sqlId',           label:'SQL ID',              w:130 },
    { key:'queryId',         label:'Query ID',            w:140 },
    { key:'sqlText',         label:'SQL Text',            w:220 },
    { key:'calls',           label:'Calls',               w:70,  right:true },
    { key:'totalTime',       label:'Total Time (sec)',    w:120, red:true, right:true },
    { key:'sharedBlocksHit', label:'Shared Blocks Hit',  w:130, red:true, right:true },
    { key:'localBlocksHit',  label:'Local Blocks Hit',   w:120, right:true },
    { key:'sharedBlocksRead',label:'Shared Blocks Read', w:130, red:true, right:true },
    { key:'localBlocksRead', label:'Local Blocks Read',  w:120, right:true },
    { key:'tempBlocks',      label:'Temp Blocks',        w:100, right:true },
  ]
  const avgCols: ColDef[] = [
    { key:'userName',           label:'User Name',              w:88  },
    { key:'sqlId',              label:'SQL ID',                 w:100 },
    { key:'queryId',            label:'Query ID',               w:110 },
    { key:'sqlText',            label:'SQL Text',               w:180 },
    { key:'calls',              label:'Calls',                  w:70,  right:true },
    { key:'maxExecution',       label:'Max Execution (sec)',    w:130, right:true },
    { key:'minExecution',       label:'Min Execution Time (sec)',w:150,right:true },
    { key:'databaseName',       label:'Database Name',          w:110 },
    { key:'totalTime',          label:'Total Time (sec)',       w:120, red:true, right:true },
    { key:'sharedBlocksHit',    label:'Shared Blocks Hit',     w:130, red:true, right:true },
    { key:'localBlocksHit',     label:'Local Blocks Hit',      w:120, right:true },
    { key:'sharedBlocksRead',   label:'Shared Blocks Read',    w:130, right:true },
    { key:'localBlocksRead',    label:'Local Blocks Read',     w:120, right:true },
    { key:'tempBlocksRead',     label:'Temp Blocks Read',      w:120, right:true },
    { key:'sharedBlocksWritten',label:'Shared Blocks Written', w:150, red:true, right:true },
    { key:'localBlocksWritten', label:'Local Blocks Written',  w:140, red:true, right:true },
  ]
  const cols = viewMode === 'sum' ? sumCols : avgCols
  const LINK_KEYS = new Set(['sqlId','queryId','sqlText'])

  const thS: React.CSSProperties = {
    padding:'7px 8px', fontSize:11, fontWeight:600,
    color:'#374151', background:'#e8eaed',
    borderBottom:'1px solid #d1d5db', borderRight:'1px solid #d1d5db',
    whiteSpace:'nowrap', position:'sticky', top:0, zIndex:1,
  }

  const navBtnS: React.CSSProperties = {
    background:'none', border:'1px solid var(--border)', borderRadius:3,
    padding:'2px 6px', cursor:'pointer', color:'var(--text-muted)', fontSize:11,
  }

  if (selectedRow) return <SqlDetailView row={selectedRow} onBack={() => setSelectedRow(null)} />

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:0 }}>

      {/* SQL Full Text 팝업 */}
      {fullText !== null && <SqlFullTextModal sql={fullText} onClose={() => setFullText(null)} />}

      {/* ── 헤더 행 ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:10, borderBottom:'1px solid var(--border)', marginBottom:8, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>SQL List</span>
          <span style={{ fontSize:11, color:'var(--text-muted)', cursor:'help' }} title="SQL 통계">?</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* 메트릭과 동일한 TimeRangePicker */}
          <TimeRangePicker selected={timeRange} onSelect={setTimeRange} paused={paused} pausedAt={pausedAt} />

          {/* ◀◀ ⏸/▶ ▶▶ — 메트릭과 동일 */}
          <div style={{ display:'flex', gap:2 }}>
            <button style={navBtnS}>◀◀</button>
            <button
              onClick={() => { setPaused(p => { if (!p) setPausedAt(new Date()); return !p }) }}
              style={{
                ...navBtnS,
                background: paused ? 'rgba(0,109,255,.15)' : 'none',
                color: paused ? '#006DFF' : 'var(--text-muted)',
              }}
              title={paused ? '재개' : '일시정지'}
            >{paused ? '▶' : '⏸'}</button>
            <button style={navBtnS}>▶▶</button>
          </div>

          {/* Sum / Avg 토글 */}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:11, fontWeight:600, color:'#059669' }}>Sum</span>
            <div
              onClick={() => setViewMode(v => v === 'sum' ? 'avg' : 'sum')}
              style={{
                width:34, height:18, borderRadius:9, cursor:'pointer', position:'relative',
                background: viewMode === 'sum' ? '#059669' : '#dc2626',
                transition:'background .2s',
              }}
            >
              <div style={{
                position:'absolute', top:2, width:14, height:14, borderRadius:'50%', background:'#fff',
                transition:'left .2s', left: viewMode === 'sum' ? 2 : 18,
                boxShadow:'0 1px 3px rgba(0,0,0,.3)',
              }} />
            </div>
            <span style={{ fontSize:11, fontWeight:600, color:'#dc2626' }}>Avg</span>
          </div>
        </div>
      </div>

      {/* ── 필터 행 ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexShrink:0 }}>
        <select value={filterMode} onChange={e => setFilterMode(e.target.value as 'OR'|'AND')}
          style={{ padding:'4px 8px', fontSize:12, border:'1px solid #d1d5db', borderRadius:4, background:'#fff', color:'#374151', cursor:'pointer', height:34, flexShrink:0 }}>
          <option>OR</option>
          <option>AND</option>
        </select>
        <FilterBar
          filters={filters}
          onAdd={chip => setFilters(prev => [...prev, chip])}
          onRemove={id => setFilters(prev => prev.filter(f => f.id !== id))}
          onClear={() => setFilters([])}
        />
      </div>

      {/* ── 테이블 ── */}
      <div style={{ flex:1, overflow:'auto', border:'1px solid #d1d5db', borderRadius:4 }}>
        <table style={{ borderCollapse:'collapse', width:'max-content', minWidth:'100%' }}>
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.key} style={{ ...thS, minWidth:c.w, textAlign: c.right ? 'right' : 'center',
                  color: c.red ? (viewMode === 'sum' ? '#059669' : '#dc2626') : '#374151' }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((r, i) => (
              <tr key={r.sqlId + i}
                style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.015)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,0,0,.04)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.015)' }}
              >
                {cols.map(c => {
                  const isLink = LINK_KEYS.has(c.key)
                  const isSqlText = c.key === 'sqlText'
                  const isNavLink = c.key === 'sqlId' || c.key === 'queryId'
                  const raw = (r as any)[c.key]
                  const val = typeof raw === 'number' ? raw.toLocaleString() : String(raw ?? '')
                  const handleClick = isSqlText
                    ? () => setFullText(r.sqlText)
                    : isNavLink
                    ? () => setSelectedRow(r)
                    : undefined
                  return (
                    <td key={c.key}
                      onClick={handleClick}
                      style={{
                        padding:'6px 8px', fontSize:11,
                        color: isLink ? '#006DFF' : '#111827',
                        borderBottom:'1px solid #e5e7eb', borderRight:'1px solid #e5e7eb',
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                        maxWidth: c.w, textAlign: c.right ? 'right' : 'left',
                        cursor: (isSqlText || isNavLink) ? 'pointer' : 'default',
                      }}
                    >{val}</td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const MOCK_DASHBOARDS = [
  { id: 'dash-1', name: 'DB 성능 대시보드' },
  { id: 'dash-2', name: '인프라 모니터링' },
  { id: 'dash-3', name: 'Oracle 전용 뷰' },
  { id: 'dash-4', name: '주간 리포트' },
  { id: 'dash-5', name: 'DBA 운영 현황' },
  { id: 'dash-6', name: 'SQL 분석 보드' },
]

// 인스턴스별 기본 연결 대시보드 (mock)
const DEFAULT_CONNECTED: Record<string, string[]> = {}

function getConnected(instanceId: string) {
  if (!DEFAULT_CONNECTED[instanceId]) {
    DEFAULT_CONNECTED[instanceId] = ['dash-1', 'dash-3']
  }
  return DEFAULT_CONNECTED[instanceId]
}

function InfoTab({ instance }: { instance: DbInstance }) {
  const score = 95 + Math.random() * 4
  const [showDetail, setShowDetail] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [connected, setConnected] = useState<string[]>(() => getConnected(instance.id))

  const toggleDashboard = (id: string) => {
    setConnected(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      DEFAULT_CONNECTED[instance.id] = next
      return next
    })
  }

  const connectedDashboards = MOCK_DASHBOARDS.filter(d => connected.includes(d.id))

  const btnStyle: React.CSSProperties = {
    fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)',
    background: 'var(--card-bg)', color: 'var(--text-primary)', cursor: 'pointer',
    whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 2,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* AI Score */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>이상 탐지 분석 요약</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>지난 10분 ▼</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 11, color: '#dc2626', marginBottom: 4 }}>● Critical</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>
                {instance.status === 'critical' ? Math.floor(Math.random() * 5) + 1 : 0}
              </div>
            </div>
            <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 11, color: '#d97706', marginBottom: 4 }}>⚠ Warning</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#d97706' }}>
                {instance.status === 'warning' ? Math.floor(Math.random() * 10) + 1 : Math.floor(Math.random() * 50) + 10}
              </div>
            </div>
          </div>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Score</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#1d4ed8' }}>{score.toFixed(3)}<span style={{ fontSize: 14 }}>점</span></div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>실시간 Score</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12, width: '100%' }}>
            {['지난 1일', '지난 7일', '지난 30일'].map(p => (
              <div key={p} style={{ textAlign: 'center', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 4px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p} (평균)</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1d4ed8' }}>{(score - Math.random() * 0.5).toFixed(3)}<span style={{ fontSize: 10 }}>점</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Info */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ background: 'var(--grid-header-bg)', padding: '8px 16px', fontWeight: 600, fontSize: 12 }}>에이전트</div>
        <div style={{ padding: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <tbody>
              {/* Instance Name — 액션 버튼 포함 */}
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '7px 12px', color: 'var(--text-muted)', width: 180 }}>Instance Name</td>
                <td style={{ padding: '7px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text-primary)' }}>{instance.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {/* Single */}
                      <button style={btnStyle} title="Single View로 이동"
                        onClick={() => alert(`Single View: /database/single/${instance.id} (미구현)`)}>
                        Single <span style={{ fontSize: 10 }}>›</span>
                      </button>
                      {/* Multi */}
                      <button style={btnStyle} title="Multi View로 이동"
                        onClick={() => alert(`Multi View: /database/multi/${instance.group} (미구현)`)}>
                        Multi <span style={{ fontSize: 10 }}>›</span>
                      </button>
                      {/* Detail */}
                      <div style={{ position: 'relative' }}>
                        <button style={btnStyle} title="연결된 대시보드 선택"
                          onClick={() => { setShowDetail(p => !p); setShowSettings(false) }}>
                          Detail <span style={{ fontSize: 10 }}>›</span>
                        </button>
                        {showDetail && (
                          <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: 4,
                            background: 'var(--card-bg)', border: '1px solid var(--border)',
                            borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,.2)',
                            zIndex: 10, minWidth: 200, overflow: 'hidden',
                          }}>
                            <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                              연결된 대시보드
                            </div>
                            {connectedDashboards.length === 0 ? (
                              <div style={{ padding: '12px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>연결된 대시보드 없음</div>
                            ) : connectedDashboards.map(d => (
                              <button key={d.id} style={{
                                display: 'block', width: '100%', textAlign: 'left',
                                padding: '9px 14px', fontSize: 12, background: 'none',
                                border: 'none', cursor: 'pointer', color: 'var(--text-primary)',
                                borderBottom: '1px solid var(--border)',
                              }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg, rgba(0,109,255,.08))')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                onClick={() => { setShowDetail(false); alert(`대시보드로 이동: /dashboard/${d.id} (미구현)`) }}>
                                {d.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Settings */}
                      <div style={{ position: 'relative' }}>
                        <button style={{ ...btnStyle, padding: '3px 7px' }} title="대시보드 연결 설정"
                          onClick={() => { setShowSettings(p => !p); setShowDetail(false) }}>
                          ⚙
                        </button>
                        {showSettings && (
                          <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: 4,
                            background: 'var(--card-bg)', border: '1px solid var(--border)',
                            borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,.2)',
                            zIndex: 10, minWidth: 220, overflow: 'hidden',
                          }}>
                            <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                              대시보드 연결 관리
                            </div>
                            {MOCK_DASHBOARDS.map(d => (
                              <label key={d.id} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 14px', cursor: 'pointer', fontSize: 12,
                                color: 'var(--text-primary)', borderBottom: '1px solid var(--border)',
                              }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg, rgba(0,109,255,.08))')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                <input type="checkbox" checked={connected.includes(d.id)}
                                  onChange={() => toggleDashboard(d.id)}
                                  style={{ accentColor: '#006DFF', cursor: 'pointer' }} />
                                {d.name}
                              </label>
                            ))}
                            <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'flex-end' }}>
                              <button style={{ ...btnStyle, background: '#006DFF', color: '#fff', border: 'none', padding: '4px 12px' }}
                                onClick={() => setShowSettings(false)}>
                                확인
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>

              {/* 나머지 행 */}
              {[
                ['Status', instance.status],
                ['Instance Group Name', instance.group],
                ['Agent Version', 'v3.0.508.64'],
                ['DB Engine', instance.dbType.charAt(0).toUpperCase() + instance.dbType.slice(1)],
                ['DB Version', instance.version || '-'],
                ['Host IP', instance.hostIp],
                ['Deploy Type', instance.deployType],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '7px 12px', color: 'var(--text-muted)', width: 180 }}>{k}</td>
                  <td style={{ padding: '7px 12px', color: k === 'Status' ? (instance.status === 'active' ? '#059669' : '#dc2626') : 'var(--text-primary)', fontWeight: k === 'Status' ? 600 : 400 }}>
                    {k === 'Status' ? (
                      <span style={{ background: instance.status === 'active' ? '#d1fae5' : '#fee2e2', color: instance.status === 'active' ? '#059669' : '#dc2626', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                        {instance.status.charAt(0).toUpperCase() + instance.status.slice(1)}
                      </span>
                    ) : v}
                  </td>
                </tr>
              ))}

              {/* Last Boot Time */}
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '7px 12px', color: 'var(--text-muted)', width: 180 }}>Last Boot Time</td>
                <td style={{ padding: '7px 12px', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 11 }}>
                  2025-02-07 09:44:55.995289 +0000 UTC
                </td>
              </tr>

              {/* Uptime */}
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '7px 12px', color: 'var(--text-muted)', width: 180 }}>Uptime</td>
                <td style={{ padding: '7px 12px', color: 'var(--text-primary)' }}>399day</td>
              </tr>

              {/* Database List — PostgreSQL 전용 */}
              {instance.dbType === 'postgresql' && (
                <tr>
                  <td colSpan={2} style={{ padding: '12px 12px 4px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Database List</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: 'var(--grid-header-bg)' }}>
                          {['Database Name', 'Default DB', 'Status', 'User'].map(h => (
                            <th key={h} style={{ padding: '6px 10px', textAlign: h === 'Default DB' ? 'center' : 'left', fontWeight: 500, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { db: 'postgres',        defaultDb: true,  status: 'Active',   user: 'postgres' },
                          { db: 'app_main',        defaultDb: false, status: 'Active',   user: 'postgres' },
                          { db: 'app_archive',     defaultDb: false, status: 'Active',   user: 'postgres' },
                          { db: 'analytics',       defaultDb: false, status: 'Inactive', user: 'analyst' },
                          { db: 'app_legacy',      defaultDb: false, status: 'Inactive', user: 'legacy_usr' },
                          { db: 'template1',       defaultDb: false, status: 'Inactive', user: 'postgres' },
                        ].map((row, i) => (
                          <tr key={row.db} style={{ borderBottom: '1px solid var(--border-light)', background: i % 2 === 1 ? 'var(--grid-alt-bg, rgba(255,255,255,.02))' : 'transparent' }}>
                            <td style={{ padding: '6px 10px', color: '#006DFF', fontWeight: 500 }}>{row.db}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                              {row.defaultDb && (
                                <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, display: 'inline-block' }}>●</span>
                              )}
                            </td>
                            <td style={{ padding: '6px 10px' }}>
                              <span style={{
                                fontSize: 11, padding: '2px 7px', borderRadius: 4,
                                background: row.status === 'Active' ? '#d1fae5' : '#f3f4f6',
                                color: row.status === 'Active' ? '#059669' : '#6b7280',
                              }}>
                                {row.status}
                              </span>
                            </td>
                            <td style={{ padding: '6px 10px', color: 'var(--text-primary)' }}>{row.user}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Machine Info */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ background: 'var(--grid-header-bg)', padding: '8px 16px', fontWeight: 600, fontSize: 12 }}>머신</div>
        <div style={{ padding: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <tbody>
              {[
                ['Host Name', instance.name.toLowerCase() + '-host'],
                ['Host IP',   instance.hostIp],
                ['OS',        'Ubuntu 22.04.3 LTS'],
                ['Kernel Version', '5.15.0-91-generic'],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '7px 12px', color: 'var(--text-muted)', width: 180 }}>{k}</td>
                  <td style={{ padding: '7px 12px', color: 'var(--text-primary)' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 드롭다운 닫기용 backdrop */}
      {(showDetail || showSettings) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9 }}
          onClick={() => { setShowDetail(false); setShowSettings(false) }} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// LOCK TREE TAB
// ─────────────────────────────────────────────────────────────────
interface LockNode {
  sessionId: string
  pid: number
  user: string
  host: string
  dbType: string
  sql: string
  databaseName: string
  queryStart: string
  collectTime: string
  waitTime: number
  lockType: string
  lockMode: 'X' | 'S' | 'IX' | 'IS'
  status: 'holder' | 'waiter'
  holderPid?: number
  waiters: LockNode[]
}

function makeMockLockTree(hasCritical: boolean): LockNode[] {
  if (!hasCritical) return []
  const now = new Date()
  const ct  = fmtDate(now)
  const mk  = (sec: number) => fmtDate(new Date(now.getTime() - sec * 1000))
  return [
    {
      sessionId: '368448', pid: 368448, user: 'postgres', host: '127.0.0.1',
      dbType: 'PostgreSQL', sql: "UPDATE table_a SET name = 0 WHERE id = 62",
      databaseName: 'SSH_TEST', queryStart: mk(15), collectTime: ct,
      waitTime: 0, lockType: 'ROW', lockMode: 'X', status: 'holder',
      waiters: [
        {
          sessionId: '368892', pid: 368892, user: 'postgres', host: '127.0.0.1',
          dbType: 'PostgreSQL', sql: "UPDATE table_a SET name = 0 WHERE id = 62",
          databaseName: 'SSH_TEST', queryStart: mk(10), collectTime: ct,
          waitTime: 10, lockType: 'ROW', lockMode: 'X', status: 'waiter',
          holderPid: 368448, waiters: [],
        },
        {
          sessionId: '369104', pid: 369104, user: 'app_user', host: '10.10.2.7',
          dbType: 'PostgreSQL', sql: "UPDATE table_a SET value = 'new' WHERE id = 62",
          databaseName: 'SSH_TEST', queryStart: mk(7), collectTime: ct,
          waitTime: 7, lockType: 'ROW', lockMode: 'X', status: 'waiter',
          holderPid: 368448, waiters: [],
        },
      ],
    },
    {
      sessionId: '370100', pid: 370100, user: 'dba_admin', host: '10.10.1.2',
      dbType: 'PostgreSQL', sql: "ALTER TABLE audit_log ADD INDEX idx_created (created_at)",
      databaseName: 'AUDIT_DB', queryStart: mk(42), collectTime: ct,
      waitTime: 0, lockType: 'TABLE', lockMode: 'X', status: 'holder',
      waiters: [
        {
          sessionId: '370250', pid: 370250, user: 'batch', host: '10.10.2.10',
          dbType: 'PostgreSQL', sql: "INSERT INTO audit_log (action, ts) VALUES ('login', NOW())",
          databaseName: 'AUDIT_DB', queryStart: mk(31), collectTime: ct,
          waitTime: 31, lockType: 'TABLE', lockMode: 'IX', status: 'waiter',
          holderPid: 370100,
          waiters: [
            {
              sessionId: '370388', pid: 370388, user: 'report', host: '10.10.2.15',
              dbType: 'PostgreSQL', sql: "SELECT COUNT(*) FROM audit_log WHERE ts > NOW() - INTERVAL '1d'",
              databaseName: 'AUDIT_DB', queryStart: mk(18), collectTime: ct,
              waitTime: 18, lockType: 'TABLE', lockMode: 'S', status: 'waiter',
              holderPid: 370250, waiters: [],
            },
          ],
        },
      ],
    },
  ]
}

const LOCK_FILTER_FIELDS = [
  { key: 'pid',          label: 'PID',           isDefault: true  },
  { key: 'status',       label: 'Lock Status',   isDefault: true  },
  { key: 'user',         label: 'User Name',     isDefault: false },
  { key: 'databaseName', label: 'Database Name', isDefault: false },
  { key: 'sql',          label: 'SQL Text',      isDefault: false },
]

const LOCK_MODE_COLOR: Record<string, { bg: string; color: string }> = {
  X:  { bg: '#fee2e2', color: '#dc2626' },
  S:  { bg: '#dbeafe', color: '#1d4ed8' },
  IX: { bg: '#fef3c7', color: '#d97706' },
  IS: { bg: '#d1fae5', color: '#059669' },
}

function LockTreeTab({ instance }: { instance: DbInstance }) {
  const hasCritical = instance.status === 'critical'
  const [lockData, setLockData]     = useState(() => makeMockLockTree(hasCritical))
  const [expanded, setExpanded]     = useState<Set<string>>(() => new Set(makeMockLockTree(hasCritical).map(n => n.sessionId)))
  const [fullText, setFullText]     = useState<string | null>(null)
  const [pidDetail, setPidDetail]   = useState<ActiveSession | null>(null)
  const [filters, setFilters]       = useState<FilterChip[]>([])
  const [filterMode, setFilterMode] = useState<'OR' | 'AND'>('OR')
  const [selected, setSelected]     = useState<Set<number>>(new Set())
  const [killConfirm, setKillConfirm] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(() => fmtDate(new Date()))

  if (pidDetail) {
    return <PidHistoryView session={pidDetail} onBack={() => setPidDetail(null)} />
  }

  const lockNodeToSession = (node: LockNode): ActiveSession => ({
    pid: node.pid, userName: node.user, appName: 'psql',
    clientAddress: node.host, clientHostName: node.host,
    backendStart: node.queryStart, elapsedTime: node.waitTime,
    sqlId: '', queryId: '', sqlText: node.sql,
    waitEvent: 'ClientRead', waitEventType: 'Client',
    state: node.status === 'holder' ? 'idle in transaction' : 'active',
    xactStart: node.queryStart, databaseName: node.databaseName, collectTime: node.collectTime,
  })

  // 필터 적용
  const applyFilter = (node: LockNode, f: FilterChip): boolean => {
    const raw = node[f.fieldKey as keyof LockNode]
    const val = String(raw ?? '').toLowerCase()
    const fval = f.value.toLowerCase()
    switch (f.operator) {
      case '==':       return val === fval
      case '!=':       return val !== fval
      case 'like':     return val.includes(fval)
      case 'not like': return !val.includes(fval)
      default:         return true
    }
  }

  const matchesFilter = (node: LockNode): boolean => {
    if (filters.length === 0) return true
    return filterMode === 'OR'
      ? filters.some(f => applyFilter(node, f))
      : filters.every(f => applyFilter(node, f))
  }

  // holder + 펼쳐진 waiter들을 flat 배열로 (필터 적용)
  const flatRows: Array<{ node: LockNode; depth: number }> = []
  const flatten = (nodes: LockNode[], depth: number) => {
    for (const n of nodes) {
      if (matchesFilter(n)) flatRows.push({ node: n, depth })
      if (expanded.has(n.sessionId) && n.waiters.length > 0) flatten(n.waiters, depth + 1)
    }
  }
  flatten(lockData, 0)

  // 전체 선택
  const allPids = flatRows.map(r => r.node.pid)
  const allChecked = allPids.length > 0 && allPids.every(p => selected.has(p))
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(allPids))
  const toggleRow = (pid: number) => setSelected(prev => {
    const next = new Set(prev); next.has(pid) ? next.delete(pid) : next.add(pid); return next
  })

  // Kill — 선택된 PID 및 그 하위 waiter 모두 제거
  const killPids = (pids: Set<number>, nodes: LockNode[]): LockNode[] =>
    nodes.filter(n => !pids.has(n.pid)).map(n => ({ ...n, waiters: killPids(pids, n.waiters) }))

  const killSelected = () => {
    setLockData(prev => killPids(selected, prev))
    setSelected(new Set())
    setKillConfirm(false)
  }

  const refresh = () => {
    setLockData(makeMockLockTree(hasCritical))
    setSelected(new Set())
    setLastUpdated(fmtDate(new Date()))
  }

  const COLS = [
    { key: 'pid',          label: 'PID',           w: 100 },
    { key: 'status',       label: 'Lock Status',   w: 90  },
    { key: 'holderPid',    label: 'Holder PID',    w: 90  },
    { key: 'user',         label: 'User Name',     w: 100 },
    { key: 'databaseName', label: 'Database Name', w: 120 },
    { key: 'sql',          label: 'SQL Text',      w: 200 },
    { key: 'queryStart',   label: 'Query Start',   w: 148 },
    { key: 'collectTime',  label: 'Collect Time',  w: 148 },
  ]
  const thStyle: React.CSSProperties = {
    padding: '8px 12px', borderBottom: '1px solid var(--border)', textAlign: 'left',
    fontWeight: 600, color: '#374151', fontSize: 12, whiteSpace: 'nowrap', background: '#f9fafb',
  }
  const tdStyle: React.CSSProperties = {
    padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 12,
  }

  return (
    <>
      {fullText && <SqlFullTextModal sql={fullText} onClose={() => setFullText(null)} />}

      {/* Kill 확인 모달 */}
      {killConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setKillConfirm(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)' }} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 8, padding: 24, width: 320, boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>세션 종료 확인</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              선택된 {selected.size}개 세션을 종료하시겠습니까?
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setKillConfirm(false)} style={{ padding: '6px 16px', fontSize: 12, borderRadius: 4, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>취소</button>
              <button onClick={killSelected} style={{ padding: '6px 16px', fontSize: 12, borderRadius: 4, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>종료</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Lock 세션 목록</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lastUpdated}</span>
        </div>

        {/* FilterBar + Kill + Get */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <select
            value={filterMode}
            onChange={e => setFilterMode(e.target.value as 'OR' | 'AND')}
            style={{ padding: '4px 8px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 4, background: '#fff', cursor: 'pointer', height: 34, flexShrink: 0 }}
          >
            <option>OR</option>
            <option>AND</option>
          </select>

          <FilterBar
            filters={filters}
            fields={LOCK_FILTER_FIELDS}
            onAdd={chip => setFilters(prev => [...prev, chip])}
            onRemove={id => setFilters(prev => prev.filter(f => f.id !== id))}
            onClear={() => setFilters([])}
          />

          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              disabled={selected.size === 0}
              onClick={() => selected.size > 0 && setKillConfirm(true)}
              style={{
                padding: '5px 14px', fontSize: 12, borderRadius: 4, height: 34,
                cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
                border: '1px solid var(--border)',
                background: selected.size > 0 ? '#dc2626' : 'var(--card-bg)',
                color: selected.size > 0 ? '#fff' : 'var(--text-muted)', fontWeight: 600,
              }}
            >Multi Kill</button>
            <button
              onClick={refresh}
              style={{ display: 'flex', alignItems: 'center', gap: 4, height: 34, padding: '5px 14px', fontSize: 12, borderRadius: 4, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
            >↻ Get</button>
          </div>
        </div>

        {/* 테이블 */}
        {lockData.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#059669', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }}>
            ✓ 현재 Lock이 없습니다
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 36, padding: '8px 10px' }}>
                      <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ cursor: 'pointer' }} />
                    </th>
                    {COLS.map(c => <th key={c.key} style={{ ...thStyle, minWidth: c.w }}>{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {flatRows.map(({ node, depth }) => {
                    const isHolder    = node.status === 'holder'
                    const hasChildren = node.waiters.length > 0
                    const isExp       = expanded.has(node.sessionId)
                    const isSel       = selected.has(node.pid)
                    return (
                      <tr
                        key={node.sessionId}
                        style={{ background: isSel ? 'rgba(0,109,255,.08)' : depth > 0 ? '#fffdf0' : '#fff' }}
                        onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,0,0,.03)' }}
                        onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLTableRowElement).style.background = depth > 0 ? '#fffdf0' : '#fff' }}
                      >
                        <td style={{ ...tdStyle, padding: '8px 10px', textAlign: 'center' }}>
                          <input type="checkbox" checked={isSel} onChange={() => toggleRow(node.pid)} style={{ cursor: 'pointer' }} />
                        </td>

                        {/* PID */}
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: depth * 20 }}>
                            {isHolder && hasChildren ? (
                              <button
                                onClick={() => setExpanded(prev => { const next = new Set(prev); next.has(node.sessionId) ? next.delete(node.sessionId) : next.add(node.sessionId); return next })}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: 'var(--text-muted)', padding: '0 2px', lineHeight: 1 }}
                              >{isExp ? '▼' : '▶'}</button>
                            ) : <span style={{ width: 14, display: 'inline-block' }} />}
                            <button onClick={() => setPidDetail(lockNodeToSession(node))}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#006DFF', fontSize: 12, padding: 0, fontWeight: 500 }}
                            >{node.pid}</button>
                          </div>
                        </td>

                        {/* Lock Status */}
                        <td style={tdStyle}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 700, background: isHolder ? '#fee2e2' : '#fef3c7', color: isHolder ? '#dc2626' : '#d97706' }}>
                            {isHolder ? 'holder' : 'waiter'}
                          </span>
                        </td>

                        <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{node.holderPid ?? ''}</td>
                        <td style={tdStyle}>{node.user}</td>
                        <td style={tdStyle}>{node.databaseName}</td>

                        {/* SQL Text */}
                        <td style={{ ...tdStyle, maxWidth: 200 }}>
                          <button onClick={() => setFullText(node.sql)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#006DFF', fontSize: 12, padding: 0, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200, display: 'block' }}
                          >{node.sql.length > 28 ? node.sql.slice(0, 28) + ' ...' : node.sql}</button>
                        </td>

                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{node.queryStart}</td>
                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{node.collectTime}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function countWaiters(node: LockNode): number {
  return node.waiters.reduce((s, w) => s + 1 + countWaiters(w), 0)
}
// ── Active Session Tab ────────────────────────────────────────────
interface ActiveSession {
  pid: number
  userName: string
  appName: string
  clientAddress: string
  clientHostName: string
  backendStart: string
  elapsedTime: number
  sqlId: string
  queryId: string
  sqlText: string
  waitEvent: string
  waitEventType: string
  state: string
  xactStart: string
  databaseName: string
  collectTime: string
}

interface FilterChip {
  id: string
  field: string
  fieldKey: string
  operator: string
  value: string
}

const FILTER_FIELDS = [
  { key: 'pid',            label: 'PID',                isDefault: true  },
  { key: 'sqlText',        label: 'SQL Text',           isDefault: true  },
  { key: 'userName',       label: 'User Name',          isDefault: false },
  { key: 'databaseName',   label: 'Database Name',      isDefault: false },
  { key: 'appName',        label: 'App Name',           isDefault: false },
  { key: 'clientAddress',  label: 'Client Address',     isDefault: false },
  { key: 'clientHostName', label: 'Client Host Name',   isDefault: false },
  { key: 'backendStart',   label: 'Backend Start',      isDefault: false },
  { key: 'elapsedTime',    label: 'Elapsed Time (sec)', isDefault: false },
  { key: 'sqlId',          label: 'SQL ID',             isDefault: false },
  { key: 'queryId',        label: 'Query ID',           isDefault: false },
  { key: 'waitEvent',      label: 'Wait Event',         isDefault: false },
]

const OPERATORS = ['==', '!=', 'like', 'not like']

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}

const SQL_SAMPLES2 = [
  'SELECT pg_sleep(5)',
  'SELECT COUNT(*) FROM ingredients WHERE id = ?',
  'UPDATE ingredient SET value = ? WHERE id = ?',
  'SELECT * FROM orders WHERE created_at > ?',
  'INSERT INTO logs(event, ts) VALUES (?, ?)',
  'DELETE FROM temp_data WHERE created_at < ?',
]
const WAIT_EVENTS2 = [
  { event: 'PgSleep',    type: 'Timeout' },
  { event: 'CPU',        type: 'CPU'     },
  { event: 'WALWrite',   type: 'LWLock'  },
  { event: 'WALSync',    type: 'IO'      },
  { event: 'Lock',       type: 'Lock'    },
  { event: 'ClientRead', type: 'Client'  },
]

function makeHex2(len: number) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

const BASE_SESSIONS: Omit<ActiveSession, 'collectTime' | 'xactStart'>[] = [
  { pid: 520756, userName: 'postgres', appName: 'loadtools', clientAddress: '172.17.0.1', clientHostName: '', backendStart: '2025-02-11 15:59:28', elapsedTime: 0, sqlId: '8093eda369...', queryId: '-341635644...', sqlText: 'SELECT pg_sleep(5)',                    waitEvent: 'PgSleep',   waitEventType: 'Timeout', state: 'active', databaseName: 'postgres' },
  { pid: 55,     userName: 'postgres', appName: 'loadtools', clientAddress: '172.17.0.1', clientHostName: '', backendStart: '2025-02-07 18:44:56', elapsedTime: 0, sqlId: '54ea88ba4c...', queryId: '',              sqlText: 'SELECT COUNT(*) FROM ingr...',        waitEvent: 'CPU',       waitEventType: 'CPU',     state: 'active', databaseName: 'postgres' },
  { pid: 520736, userName: 'postgres', appName: 'loadtools', clientAddress: '172.17.0.1', clientHostName: '', backendStart: '2025-02-11 15:59:19', elapsedTime: 0, sqlId: '23838c7da8...', queryId: '6564320877...', sqlText: 'UPDATE ingredient SET value...',       waitEvent: 'WALWrite',  waitEventType: 'LWLock',  state: 'active', databaseName: 'postgres' },
  { pid: 520757, userName: 'postgres', appName: 'loadtools', clientAddress: '172.17.0.1', clientHostName: '', backendStart: '2025-02-11 15:59:28', elapsedTime: 4, sqlId: '8093eda369...', queryId: '-341635644...', sqlText: 'SELECT pg_sleep(5)',                    waitEvent: 'PgSleep',   waitEventType: 'Timeout', state: 'active', databaseName: 'postgres' },
  { pid: 520760, userName: 'postgres', appName: 'loadtools', clientAddress: '172.17.0.1', clientHostName: '', backendStart: '2025-02-11 15:59:28', elapsedTime: 0, sqlId: '8093eda369...', queryId: '-341635644...', sqlText: 'SELECT pg_sleep(5)',                    waitEvent: 'PgSleep',   waitEventType: 'Timeout', state: 'active', databaseName: 'postgres' },
  { pid: 520753, userName: 'postgres', appName: 'loadtools', clientAddress: '172.17.0.1', clientHostName: '', backendStart: '2025-02-11 15:59:26', elapsedTime: 0, sqlId: '5b70687597...', queryId: '2343501929...', sqlText: 'UPDATE ingredient SET value...',       waitEvent: 'CPU',       waitEventType: 'CPU',     state: 'active', databaseName: 'postgres' },
  { pid: 520758, userName: 'postgres', appName: 'loadtools', clientAddress: '172.17.0.1', clientHostName: '', backendStart: '2025-02-11 15:59:28', elapsedTime: 4, sqlId: '8093eda369...', queryId: '-341635644...', sqlText: 'SELECT pg_sleep(5)',                    waitEvent: 'PgSleep',   waitEventType: 'Timeout', state: 'active', databaseName: 'postgres' },
  { pid: 520735, userName: 'postgres', appName: 'loadtools', clientAddress: '172.17.0.1', clientHostName: '', backendStart: '2025-02-11 15:59:19', elapsedTime: 0, sqlId: '6df754128d...', queryId: '8791867689...', sqlText: 'UPDATE ingredient SET value...',       waitEvent: 'WALWrite',  waitEventType: 'LWLock',  state: 'active', databaseName: 'postgres' },
  { pid: 520759, userName: 'postgres', appName: 'loadtools', clientAddress: '172.17.0.1', clientHostName: '', backendStart: '2025-02-11 15:59:28', elapsedTime: 1, sqlId: '8093eda369...', queryId: '-341635644...', sqlText: 'SELECT pg_sleep(5)',                    waitEvent: 'PgSleep',   waitEventType: 'Timeout', state: 'active', databaseName: 'postgres' },
  { pid: 64,     userName: 'postgres', appName: 'loadtools', clientAddress: '172.17.0.1', clientHostName: '', backendStart: '2025-02-07 18:44:56', elapsedTime: 0, sqlId: '1c3bbb955e...', queryId: '',              sqlText: 'SELECT COUNT(*) FROM ingr...',        waitEvent: 'CPU',       waitEventType: 'CPU',     state: 'active', databaseName: 'postgres' },
  { pid: 520751, userName: 'postgres', appName: 'loadtools', clientAddress: '172.17.0.1', clientHostName: '', backendStart: '2025-02-11 15:59:26', elapsedTime: 0, sqlId: '23838c7da8...', queryId: '6564320877...', sqlText: 'UPDATE ingredient SET value...',       waitEvent: 'WALSync',   waitEventType: 'IO',      state: 'active', databaseName: 'postgres' },
  { pid: 520755, userName: 'postgres', appName: 'loadtools', clientAddress: '172.17.0.1', clientHostName: '', backendStart: '2025-02-11 15:59:27', elapsedTime: 0, sqlId: '5b70687597...', queryId: '2343501929...', sqlText: 'UPDATE ingredient SET value...',       waitEvent: 'WALWrite',  waitEventType: 'LWLock',  state: 'active', databaseName: 'postgres' },
]

function genActiveSessions(): ActiveSession[] {
  const now = new Date()
  const collectTime = fmtDate(now)
  const xactBase = now.getTime()
  return BASE_SESSIONS.map((s, i) => ({
    ...s,
    xactStart:   fmtDate(new Date(xactBase - (i % 3 === 0 ? 61000 : 10000))),
    collectTime,
  }))
}

type FilterStep = 'idle' | 'field' | 'operator' | 'value'

function FilterBar({
  filters, onAdd, onClear, onRemove, fields,
}: {
  filters: FilterChip[]
  onAdd: (chip: FilterChip) => void
  onRemove: (id: string) => void
  onClear: () => void
  fields?: typeof FILTER_FIELDS
}) {
  const activeFields = fields ?? FILTER_FIELDS
  const [step, setStep]                 = useState<FilterStep>('idle')
  const [pendingField, setPendingField] = useState<typeof FILTER_FIELDS[0] | null>(null)
  const [pendingOp, setPendingOp]       = useState('')
  const [inputVal, setInputVal]         = useState('')
  const [navIdx, setNavIdx]             = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const valueRef     = useRef<HTMLInputElement>(null)

  const dropItems =
    step === 'field'      ? activeFields
    : step === 'operator' ? OPERATORS.map(o => ({ key: o, label: o, isDefault: false }))
    : []

  useEffect(() => {
    if (step === 'idle') return
    const h = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) reset()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [step])

  const reset = () => {
    setStep('idle'); setPendingField(null); setPendingOp(''); setInputVal(''); setNavIdx(0)
  }

  const selectField = (f: typeof activeFields[0]) => {
    setPendingField(f); setStep('operator'); setNavIdx(0)
  }

  const selectOp = (op: string) => {
    setPendingOp(op); setStep('value')
    setTimeout(() => valueRef.current?.focus(), 10)
  }

  const commit = () => {
    if (!pendingField || !pendingOp || !inputVal.trim()) return
    onAdd({ id: Date.now().toString(), field: pendingField.label, fieldKey: pendingField.key, operator: pendingOp, value: inputVal.trim() })
    reset()
  }

  const handleDropKey = (e: React.KeyboardEvent) => {
    if (step === 'field' || step === 'operator') {
      if (e.key === 'ArrowDown') { e.preventDefault(); setNavIdx(i => Math.min(i + 1, dropItems.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setNavIdx(i => Math.max(i - 1, 0)) }
      if (e.key === 'Enter') {
        if (step === 'field')    selectField(activeFields[navIdx])
        if (step === 'operator') selectOp(OPERATORS[navIdx])
      }
      if (e.key === 'Escape') reset()
    }
  }

  const isDropOpen = step === 'field' || step === 'operator'

  const chipStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: '#1e3a6e', color: '#7eb3ff', borderRadius: 3,
    padding: '2px 8px', fontSize: 12, flexShrink: 0,
  }
  const pendingChipStyle: React.CSSProperties = {
    ...chipStyle, background: '#1a2d50', color: '#93c5fd', border: '1px dashed #3b5998',
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1 }}>
      <div
        onClick={() => { if (step === 'idle') { setStep('field'); setNavIdx(0) } }}
        onKeyDown={handleDropKey}
        tabIndex={isDropOpen ? 0 : -1}
        style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6,
          minHeight: 34, padding: '4px 8px', cursor: step === 'idle' ? 'text' : 'default',
          border: `1px solid ${isDropOpen || step === 'value' ? '#006DFF' : 'var(--border)'}`,
          borderRadius: isDropOpen ? '4px 4px 0 0' : 4,
          background: 'var(--card-bg)', outline: 'none',
        }}
      >
        {filters.map(f => (
          <span key={f.id} style={chipStyle}>
            <span style={{ color: '#93c5fd' }}>{f.field}</span>
            <span style={{ color: '#7dd3fc', fontSize: 11 }}> {f.operator} </span>
            <b style={{ color: '#fff' }}>{f.value}</b>
            <button
              onClick={e => { e.stopPropagation(); onRemove(f.id) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7eb3ff', fontSize: 13, padding: 0, lineHeight: 1, marginLeft: 2 }}
            >x</button>
          </span>
        ))}

        {pendingField && (
          <span style={pendingChipStyle}>
            <span>{pendingField.label}</span>
            {pendingOp && <span style={{ color: '#7dd3fc', fontSize: 11 }}> {pendingOp}</span>}
            <button
              onClick={e => { e.stopPropagation(); reset() }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', fontSize: 13, padding: 0, lineHeight: 1 }}
            >x</button>
          </span>
        )}

        {step === 'value' && (
          <input
            ref={valueRef}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); commit() }
              if (e.key === 'Escape') reset()
            }}
            placeholder="Enter value and press Enter"
            style={{
              flex: 1, minWidth: 120, border: 'none', outline: 'none',
              fontSize: 12, background: 'transparent', color: 'var(--text-primary)',
            }}
          />
        )}

        {step !== 'value' && (
          <span style={{ fontSize: 14, color: step === 'idle' ? 'var(--text-muted)' : '#006DFF', lineHeight: 1 }}>|</span>
        )}

        {(filters.length > 0 || step !== 'idle') && (
          <button
            onClick={e => { e.stopPropagation(); reset(); onClear() }}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, padding: '0 4px', lineHeight: 1 }}
          >x</button>
        )}
      </div>

      {isDropOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 400,
          background: '#fff', border: '1px solid #006DFF', borderTop: 'none',
          borderRadius: '0 0 6px 6px', boxShadow: '0 6px 20px rgba(0,0,0,.25)',
          maxHeight: 320, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#111', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
            {step === 'field' ? 'Filter Category' : 'Filter Inequality Sign'}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {dropItems.map((item, i) => (
              <div
                key={item.key}
                onClick={() => step === 'field' ? selectField(FILTER_FIELDS[i]) : selectOp(OPERATORS[i])}
                onMouseEnter={() => setNavIdx(i)}
                style={{
                  padding: '9px 16px', fontSize: 13, cursor: 'pointer',
                  background: i === navIdx ? '#eff6ff' : 'transparent',
                  color: i === navIdx ? '#1d4ed8' : '#333',
                  display: 'flex', alignItems: 'center', gap: 8,
                  borderBottom: '1px solid #f8f8f8',
                }}
              >
                {item.label}
                {item.isDefault && (
                  <span style={{ fontSize: 11, background: '#3b82f6', color: '#fff', padding: '1px 8px', borderRadius: 3, fontWeight: 600 }}>
                    Default Value
                  </span>
                )}
              </div>
            ))}
          </div>
          <div style={{ padding: '6px 14px', borderTop: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', gap: 20, fontSize: 11, color: '#999' }}>
            <span>up/down to navigate</span>
            <span>Enter to select and complete</span>
            <span>Esc to close</span>
          </div>
        </div>
      )}
    </div>
  )
}

function ActiveSessionTab() {
  const [sessions, setSessions]       = useState<ActiveSession[]>(() => genActiveSessions())
  const [filters, setFilters]         = useState<FilterChip[]>([])
  const [selected, setSelected]       = useState<Set<number>>(new Set())
  const [filterMode, setFilterMode]   = useState<'OR' | 'AND'>('OR')
  const [lastUpdated, setLastUpdated] = useState(() => fmtDate(new Date()))
  const [killConfirm, setKillConfirm] = useState(false)
  const [pidDetail, setPidDetail]     = useState<ActiveSession | null>(null)
  const [selectedSqlRow, setSelectedSqlRow] = useState<SqlRow | null>(null)
  const [fullText, setFullText]       = useState<string | null>(null)

  if (pidDetail) {
    return <PidHistoryView session={pidDetail} onBack={() => setPidDetail(null)} />
  }

  if (selectedSqlRow) {
    return <SqlDetailView row={selectedSqlRow} onBack={() => setSelectedSqlRow(null)} />
  }

  const sessionToSqlRow = (s: ActiveSession): SqlRow => {
    const match = SQL_MOCK.find(r => r.sqlId.startsWith(s.sqlId.replace('...', '').slice(0, 10)))
    if (match) return match
    return {
      userName: s.userName, sqlId: s.sqlId, queryId: s.queryId, sqlText: s.sqlText,
      calls: 0, totalTime: 0, sharedBlocksHit: 0, localBlocksHit: 0,
      sharedBlocksRead: 0, localBlocksRead: 0, tempBlocks: 0,
      maxExecution: 0, minExecution: 0, databaseName: s.databaseName,
      tempBlocksRead: 0, sharedBlocksWritten: 0, localBlocksWritten: 0,
    }
  }

  const refresh = () => {
    setSessions(genActiveSessions())
    setSelected(new Set())
    setLastUpdated(fmtDate(new Date()))
  }

  const killSelected = () => {
    setSessions(prev => prev.filter(s => !selected.has(s.pid)))
    setSelected(new Set())
    setKillConfirm(false)
  }

  const applyFilter = (s: ActiveSession, f: FilterChip) => {
    const val  = String((s as any)[f.fieldKey] ?? '').toLowerCase()
    const fval = f.value.toLowerCase()
    switch (f.operator) {
      case '==':       return val === fval
      case '!=':       return val !== fval
      case 'like':     return val.includes(fval)
      case 'not like': return !val.includes(fval)
      default:         return true
    }
  }

  const displayed = filters.length === 0 ? sessions
    : filterMode === 'OR'
      ? sessions.filter(s => filters.some(f  => applyFilter(s, f)))
      : sessions.filter(s => filters.every(f => applyFilter(s, f)))

  const allChecked = displayed.length > 0 && selected.size === displayed.length
  const toggleAll  = () => setSelected(allChecked ? new Set() : new Set(displayed.map(s => s.pid)))
  const toggleRow  = (pid: number) =>
    setSelected(prev => { const n = new Set(prev); n.has(pid) ? n.delete(pid) : n.add(pid); return n })

  const cols: { key: keyof ActiveSession; label: string; w: number }[] = [
    { key: 'pid',            label: 'PID',                 w: 72  },
    { key: 'userName',       label: 'User Name',           w: 88  },
    { key: 'appName',        label: 'App Name',            w: 92  },
    { key: 'clientAddress',  label: 'Client Address',      w: 104 },
    { key: 'clientHostName', label: 'Client Host Name',    w: 100 },
    { key: 'backendStart',   label: 'Backend Start',       w: 148 },
    { key: 'elapsedTime',    label: 'Elapsed Time (sec)',  w: 80  },
    { key: 'sqlId',          label: 'SQL ID',              w: 110 },
    { key: 'queryId',        label: 'Query ID',            w: 120 },
    { key: 'sqlText',        label: 'SQL Text',            w: 200 },
    { key: 'waitEvent',      label: 'Wait Event',          w: 96  },
    { key: 'waitEventType',  label: 'Wait Event Type',     w: 88  },
    { key: 'state',          label: 'State',               w: 70  },
    { key: 'xactStart',      label: 'Xact Start',          w: 148 },
    { key: 'databaseName',   label: 'Database Name',       w: 96  },
    { key: 'collectTime',    label: 'Collect Time',        w: 148 },
  ]
  const LINK_COLS = new Set<keyof ActiveSession>(['pid', 'sqlId', 'queryId', 'sqlText'])

  const thStyle: React.CSSProperties = {
    padding: '7px 8px', fontSize: 11, fontWeight: 600,
    color: '#374151', background: '#e8eaed',
    borderBottom: '1px solid #d1d5db', borderRight: '1px solid #d1d5db',
    textAlign: 'center', lineHeight: 1.3,
    position: 'sticky', top: 0, zIndex: 1, whiteSpace: 'nowrap',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>

      {/* SQL Full Text 팝업 */}
      {fullText !== null && <SqlFullTextModal sql={fullText} onClose={() => setFullText(null)} />}

      {/* Kill 확인 모달 */}
      {killConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setKillConfirm(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)' }} />
          <div style={{
            position: 'relative', background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '24px 28px', minWidth: 280,
            boxShadow: '0 4px 20px rgba(0,0,0,.4)', display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
              선택한 세션 {selected.size}개를 종료하시겠습니까?
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setKillConfirm(false)}
                style={{ padding: '6px 18px', fontSize: 13, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-primary)', cursor: 'pointer' }}
              >Cancel</button>
              <button
                onClick={killSelected}
                style={{ padding: '6px 18px', fontSize: 13, borderRadius: 4, border: 'none', background: '#006DFF', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >OK</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Active Session List</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>i</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lastUpdated}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <select
          value={filterMode}
          onChange={e => setFilterMode(e.target.value as 'OR' | 'AND')}
          style={{
            padding: '4px 8px', fontSize: 12, border: '1px solid var(--border)',
            borderRadius: 4, background: 'var(--card-bg)', color: 'var(--text-primary)',
            cursor: 'pointer', height: 34, flexShrink: 0,
          }}
        >
          <option>OR</option>
          <option>AND</option>
        </select>

        <FilterBar
          filters={filters}
          onAdd={chip => setFilters(prev => [...prev, chip])}
          onRemove={id => setFilters(prev => prev.filter(f => f.id !== id))}
          onClear={() => setFilters([])}
        />

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            disabled={selected.size === 0}
            onClick={() => selected.size > 0 && setKillConfirm(true)}
            style={{
              padding: '5px 14px', fontSize: 12, borderRadius: 4, height: 34,
              cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
              border: '1px solid var(--border)',
              background: selected.size > 0 ? '#dc2626' : 'var(--card-bg)',
              color: selected.size > 0 ? '#fff' : 'var(--text-muted)', fontWeight: 600,
            }}
          >Multi Kill</button>
          <button
            onClick={refresh}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, height: 34,
              padding: '5px 14px', fontSize: 12, borderRadius: 4, cursor: 'pointer',
              border: '1px solid var(--border)', background: 'var(--card-bg)',
              color: 'var(--text-primary)',
            }}
          >Get</button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 4 }}>
        <table style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 36, padding: '7px 10px' }}>
                <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ cursor: 'pointer' }} />
              </th>
              {cols.map(c => (
                <th key={c.key} style={{ ...thStyle, minWidth: c.w }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((s, i) => {
              const isSel = selected.has(s.pid)
              return (
                <tr
                  key={s.pid}
                  style={{ background: isSel ? 'rgba(0,109,255,.1)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)' }}
                  onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,0,0,.04)' }}
                  onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)' }}
                >
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                    <input type="checkbox" checked={isSel} onChange={() => toggleRow(s.pid)} style={{ cursor: 'pointer' }} />
                  </td>
                  {cols.map(c => {
                    const isLink    = LINK_COLS.has(c.key)
                    const isPid     = c.key === 'pid'
                    const isSqlNav  = c.key === 'sqlId' || c.key === 'queryId'
                    const isSqlText = c.key === 'sqlText'
                    const handleClick = isPid     ? () => setPidDetail(s)
                      : isSqlNav  ? () => setSelectedSqlRow(sessionToSqlRow(s))
                      : isSqlText ? () => setFullText(s.sqlText)
                      : undefined
                    return (
                      <td
                        key={c.key}
                        onClick={handleClick}
                        style={{
                          padding: '6px 8px', fontSize: 11,
                          color: isLink ? '#006DFF' : 'var(--text-primary)',
                          borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          maxWidth: c.w, cursor: (isPid || isSqlNav || isSqlText) ? 'pointer' : 'default',
                          fontWeight: isPid ? 600 : 400,
                        }}
                      >
                        {String(s[c.key])}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            {displayed.length === 0 && (
              <tr>
                <td colSpan={cols.length + 1} style={{ padding: 32, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                  No sessions match the filter criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── PID Session History View ──────────────────────────────────────

interface HistoryRow {
  time: string
  elapsedTime: string
  waitEvent: string
  waitEventType: string
  sqlId: string
  queryId: string
  sqlText: string
  state: string
  backendStart: string
  xactStart: string
  stateChange: string
}

const HIST_SQL_POOL = [
  'SELECT pg_sleep(5)',
  'SELECT COUNT(*) FROM ingredients WHERE id = $1',
  'UPDATE ingredient SET value = $1 WHERE id = $2',
  'SELECT * FROM orders WHERE created_at > $1 LIMIT 100',
  'INSERT INTO logs(event, ts) VALUES ($1, NOW())',
  'SELECT id, name, status FROM users WHERE active = true',
  'DELETE FROM temp_data WHERE created_at < NOW() - INTERVAL \'1 day\'',
  'UPDATE orders SET status = $1 WHERE id = $2',
  'SELECT SUM(amount) FROM transactions WHERE date = CURRENT_DATE',
  'SELECT pg_sleep(5)',
]

function genSessionHistory(session: ActiveSession): HistoryRow[] {
  const now = Date.now()
  const baseSql = session.sqlText
  return Array.from({ length: 20 }, (_, i) => {
    const t        = new Date(now - (19 - i) * 5000)
    const xact     = new Date(t.getTime() - 5000)
    const elapsed  = Math.max(0.1, session.elapsedTime + (Math.random() - 0.3) * 2)
    // 최근 5개는 현재 SQL, 나머지는 풀에서 랜덤 선택
    const sqlText  = i >= 15 ? baseSql : HIST_SQL_POOL[Math.floor(Math.random() * HIST_SQL_POOL.length)]
    return {
      time:          fmtDate(t),
      elapsedTime:   elapsed.toFixed(3),
      waitEvent:     session.waitEvent,
      waitEventType: session.waitEventType,
      sqlId:         session.sqlId,
      queryId:       session.queryId,
      sqlText,
      state:         session.state,
      backendStart:  session.backendStart,
      xactStart:     fmtDate(xact),
      stateChange:   fmtDate(xact),
    }
  }).reverse()  // most recent first
}

function PidHistoryView({ session, onBack }: { session: ActiveSession; onBack: () => void }) {
  const [historyFilters, setHistoryFilters] = useState<FilterChip[]>([])
  const [hFilterMode, setHFilterMode]       = useState<'OR'|'AND'>('OR')
  const [timeRange, setTimeRange]           = useState<TimeRange>(TIME_RANGES[1])
  const history = useMemo(() => genSessionHistory(session), [session.pid])

  const applyFilter = (r: HistoryRow, f: FilterChip) => {
    const val  = String((r as any)[f.fieldKey] ?? '').toLowerCase()
    const fval = f.value.toLowerCase()
    switch (f.operator) {
      case '==':       return val === fval
      case '!=':       return val !== fval
      case 'like':     return val.includes(fval)
      case 'not like': return !val.includes(fval)
      default:         return true
    }
  }

  const displayed = historyFilters.length === 0 ? history
    : hFilterMode === 'OR'
      ? history.filter(r => historyFilters.some(f  => applyFilter(r, f)))
      : history.filter(r => historyFilters.every(f => applyFilter(r, f)))

  const histCols = [
    { key: 'time',          label: 'Time',              w: 148 },
    { key: 'elapsedTime',   label: 'Elapsed Time (sec)', w: 80  },
    { key: 'waitEvent',     label: 'Wait Event',         w: 88  },
    { key: 'waitEventType', label: 'Wait Event Type',    w: 88  },
    { key: 'sqlId',         label: 'SQL ID',             w: 120 },
    { key: 'queryId',       label: 'Query ID',           w: 130 },
    { key: 'sqlText',       label: 'SQL Text',           w: 200 },
    { key: 'state',         label: 'State',              w: 70  },
    { key: 'backendStart',  label: 'Backend Start',      w: 148 },
    { key: 'xactStart',     label: 'Xact Start',         w: 148 },
    { key: 'stateChange',   label: 'State Change',       w: 148 },
  ] as const

  const HIST_LINK = new Set(['sqlId', 'queryId'])

  const thS: React.CSSProperties = {
    padding: '7px 8px', fontSize: 11, fontWeight: 600,
    color: '#374151', background: '#e8eaed',
    borderBottom: '1px solid #d1d5db', borderRight: '1px solid #d1d5db',
    textAlign: 'center', whiteSpace: 'nowrap',
    position: 'sticky', top: 0, zIndex: 1,
  }

  const navBtn: React.CSSProperties = {
    background: 'none', border: '1px solid #d1d5db', borderRadius: 3,
    padding: '2px 6px', cursor: 'pointer', fontSize: 11, color: '#374151',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>

      {/* ── 상단 헤더 ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 10, borderBottom: '1px solid #e5e7eb', marginBottom: 10, flexShrink: 0,
      }}>
        {/* 왼쪽: 뒤로가기 + 제목 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', padding: '3px 8px', fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}
          >‹</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Session: {session.pid}</span>
        </div>

        {/* 오른쪽: 시간 범위 + 네비 + 버튼들 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TimeRangePicker selected={timeRange} onSelect={setTimeRange} />
          {/* nav arrows */}
          {(['◀◀','◀','▶','▶▶','↺'] as const).map(arrow => (
            <button key={arrow} style={navBtn}>{arrow}</button>
          ))}
          {/* Kill Session */}
          <button style={{ ...navBtn, background: '#dc2626', color: '#fff', border: '1px solid #dc2626', padding: '3px 10px', fontWeight: 600 }}>
            Kill Session
          </button>
          {/* Search Session */}
          <button style={{ ...navBtn, padding: '3px 10px' }}>
            Search Session ›
          </button>
        </div>
      </div>

      {/* ── Session Information ── */}
      <div style={{ marginBottom: 10, flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#111', marginBottom: 6 }}>Session Information</div>
        <div style={{ fontSize: 12, color: '#374151', display: 'flex', flexWrap: 'wrap', gap: '4px 0' }}>
          {[
            ['PID',            String(session.pid)],
            ['User Name',      session.userName],
            ['Database Name',  session.databaseName],
            ['App Name',       session.appName],
            ['Client Address', session.clientAddress],
          ].map(([k, v], idx, arr) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#6b7280' }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v || '—'}</span>
              {idx < arr.length - 1 && <span style={{ color: '#d1d5db', margin: '0 6px' }}>|</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── Active Session History ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
        {/* 섹션 헤더 + filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#111', whiteSpace: 'nowrap' }}>Active Session History</span>
          <select
            value={hFilterMode}
            onChange={e => setHFilterMode(e.target.value as 'OR'|'AND')}
            style={{ padding: '3px 6px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', color: '#374151', cursor: 'pointer', flexShrink: 0 }}
          >
            <option>OR</option>
            <option>AND</option>
          </select>
          <FilterBar
            filters={historyFilters}
            onAdd={chip => setHistoryFilters(prev => [...prev, chip])}
            onRemove={id  => setHistoryFilters(prev => prev.filter(f => f.id !== id))}
            onClear={() => setHistoryFilters([])}
          />
        </div>

        {/* 이력 테이블 */}
        <div style={{ flex: 1, overflow: 'auto', border: '1px solid #d1d5db', borderRadius: 4 }}>
          <table style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%' }}>
            <thead>
              <tr>
                {histCols.map(c => (
                  <th key={c.key} style={{ ...thS, minWidth: c.w }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((r, i) => (
                <tr
                  key={r.time}
                  style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.015)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,0,0,.04)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.015)' }}
                >
                  {histCols.map(c => {
                    const isLink = HIST_LINK.has(c.key)
                    const val    = String(r[c.key as keyof HistoryRow])
                    return (
                      <td key={c.key} style={{
                        padding: '6px 8px', fontSize: 11,
                        color: isLink ? '#006DFF' : c.key === 'state' ? '#059669' : '#111827',
                        borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: c.w, cursor: isLink ? 'pointer' : 'default',
                        fontWeight: c.key === 'time' ? 500 : 400,
                      }}>
                        {val}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Parameter Tab ──────────────────────────────────────────────────

interface ParamRow {
  name: string
  currentValue: string
  category: string
  description: string
}

interface ParamChangeRecord {
  changedAt: string
  oldValue: string
  newValue: string
  changedBy: string
  source: string
}

const PARAM_MOCK: ParamRow[] = [
  { name: 'allow_in_place_tablespaces',         currentValue: 'off',            category: 'Developer Options',    description: 'Allows tablespaces directly inside pg_tblspc' },
  { name: 'allow_system_table_mods',            currentValue: 'off',            category: 'Developer Options',    description: 'Allows modifications of the structure of system tables' },
  { name: 'application_name',                   currentValue: 'clouddb-agent',  category: 'Logging',              description: 'Sets the application name to be reported in statistics and logs' },
  { name: 'archive_cleanup_command',            currentValue: '',               category: 'Write-Ahead Log',      description: 'Sets the shell command that will be executed at every restart point' },
  { name: 'archive_command',                    currentValue: '(disabled)',     category: 'Write-Ahead Log',      description: 'Sets the shell command that will be called to archive a WAL file' },
  { name: 'archive_library',                    currentValue: '',               category: 'Write-Ahead Log',      description: 'Sets the library that will be called to archive a WAL file' },
  { name: 'archive_mode',                       currentValue: 'off',            category: 'Write-Ahead Log',      description: 'Allows archiving of WAL files using archive_command' },
  { name: 'archive_timeout',                    currentValue: '0',              category: 'Write-Ahead Log',      description: 'Forces a switch to the next WAL file if a new file has not been started within N seconds' },
  { name: 'array_nulls',                        currentValue: 'on',             category: 'Compatibility',        description: 'Enable input of NULL elements in arrays' },
  { name: 'authentication_timeout',             currentValue: '60',             category: 'Connections and Authentication', description: 'Sets the maximum allowed time to complete client authentication' },
  { name: 'autovacuum',                         currentValue: 'on',             category: 'Autovacuum',           description: 'Starts the autovacuum subprocess' },
  { name: 'autovacuum_analyze_scale_factor',    currentValue: '0.1',            category: 'Autovacuum',           description: 'Number of tuple inserts, updates, or deletes prior to analyze as a fraction of reltuples' },
  { name: 'autovacuum_analyze_threshold',       currentValue: '50',             category: 'Autovacuum',           description: 'Minimum number of tuple inserts, updates, or deletes prior to analyze' },
  { name: 'autovacuum_freeze_max_age',          currentValue: '200000000',      category: 'Autovacuum',           description: 'Age at which to autovacuum a table to prevent transaction ID wraparound' },
  { name: 'autovacuum_max_workers',             currentValue: '3',              category: 'Autovacuum',           description: 'Sets the maximum number of simultaneously running autovacuum worker processes' },
  { name: 'autovacuum_multixact_freeze_max_age',currentValue: '400000000',      category: 'Autovacuum',           description: 'Multixact age at which to autovacuum a table to prevent multixact wraparound' },
  { name: 'autovacuum_naptime',                 currentValue: '60',             category: 'Autovacuum',           description: 'Time to sleep between autovacuum runs' },
  { name: 'autovacuum_vacuum_cost_delay',       currentValue: '2',              category: 'Autovacuum',           description: 'Vacuum cost delay in milliseconds, for autovacuum' },
  { name: 'autovacuum_vacuum_cost_limit',       currentValue: '-1',             category: 'Autovacuum',           description: 'Vacuum cost amount available before napping, for autovacuum' },
  { name: 'autovacuum_vacuum_insert_scale_factor', currentValue: '0.2',         category: 'Autovacuum',           description: 'Number of tuple inserts prior to vacuum as a fraction of reltuples' },
  { name: 'autovacuum_vacuum_insert_threshold', currentValue: '1000',           category: 'Autovacuum',           description: 'Minimum number of tuple inserts prior to vacuum' },
  { name: 'autovacuum_vacuum_scale_factor',     currentValue: '0.2',            category: 'Autovacuum',           description: 'Number of tuple updates or deletes prior to vacuum as a fraction of reltuples' },
  { name: 'autovacuum_vacuum_threshold',        currentValue: '50',             category: 'Autovacuum',           description: 'Minimum number of tuple updates or deletes prior to vacuum' },
  { name: 'autovacuum_work_mem',                currentValue: '-1',             category: 'Autovacuum',           description: 'Sets the maximum memory to be used by each autovacuum worker process' },
  { name: 'backend_flush_after',                currentValue: '0',              category: 'Resource Usage',       description: 'Number of pages after which previously performed writes are flushed to disk' },
  { name: 'bgwriter_delay',                     currentValue: '200',            category: 'Resource Usage',       description: 'Background writer sleep time between rounds' },
  { name: 'bgwriter_flush_after',               currentValue: '64',             category: 'Resource Usage',       description: 'Number of pages after which previously performed writes are flushed to disk' },
  { name: 'bgwriter_lru_maxpages',              currentValue: '100',            category: 'Resource Usage',       description: 'Background writer maximum number of LRU pages to flush per round' },
  { name: 'bgwriter_lru_multiplier',            currentValue: '2',              category: 'Resource Usage',       description: 'Multiple of the average buffer usage to free per round' },
  { name: 'checkpoint_completion_target',       currentValue: '0.9',            category: 'Write-Ahead Log',      description: 'Time spent flushing dirty buffers during checkpoint, as fraction of checkpoint interval' },
  { name: 'checkpoint_flush_after',             currentValue: '32',             category: 'Write-Ahead Log',      description: 'Number of pages after which previously performed writes are flushed to disk' },
  { name: 'checkpoint_timeout',                 currentValue: '300',            category: 'Write-Ahead Log',      description: 'Sets the maximum time between automatic WAL checkpoints' },
  { name: 'checkpoint_warning',                 currentValue: '30',             category: 'Write-Ahead Log',      description: 'Enables warnings if checkpoint segments are filled more frequently than this' },
  { name: 'client_encoding',                    currentValue: 'UTF8',           category: 'Client Connection Defaults', description: 'Sets the client-side encoding (character set)' },
  { name: 'client_min_messages',                currentValue: 'notice',         category: 'Logging',              description: 'Sets the message levels that are sent to the client' },
  { name: 'deadlock_timeout',                   currentValue: '1000',           category: 'Lock Management',      description: 'Sets the time to wait on a lock before checking for deadlock' },
  { name: 'effective_cache_size',               currentValue: '524288',         category: 'Query Tuning',         description: 'Sets the planner\'s assumption about the total size of the data caches' },
  { name: 'effective_io_concurrency',           currentValue: '1',              category: 'Resource Usage',       description: 'Number of simultaneous requests that can be handled efficiently by the disk subsystem' },
  { name: 'enable_bitmapscan',                  currentValue: 'on',             category: 'Query Tuning',         description: 'Enables the planner\'s use of bitmap-scan plans' },
  { name: 'enable_hashagg',                     currentValue: 'on',             category: 'Query Tuning',         description: 'Enables the planner\'s use of hashed aggregation plans' },
  { name: 'enable_hashjoin',                    currentValue: 'on',             category: 'Query Tuning',         description: 'Enables the planner\'s use of hash join plans' },
  { name: 'enable_indexonlyscan',               currentValue: 'on',             category: 'Query Tuning',         description: 'Enables the planner\'s use of index-only-scan plans' },
  { name: 'enable_indexscan',                   currentValue: 'on',             category: 'Query Tuning',         description: 'Enables the planner\'s use of index-scan plans' },
  { name: 'enable_mergejoin',                   currentValue: 'on',             category: 'Query Tuning',         description: 'Enables the planner\'s use of merge join plans' },
  { name: 'enable_nestloop',                    currentValue: 'on',             category: 'Query Tuning',         description: 'Enables the planner\'s use of nested-loop join plans' },
  { name: 'enable_seqscan',                     currentValue: 'on',             category: 'Query Tuning',         description: 'Enables the planner\'s use of sequential-scan plans' },
  { name: 'enable_sort',                        currentValue: 'on',             category: 'Query Tuning',         description: 'Enables the planner\'s use of explicit sort steps' },
  { name: 'log_destination',                    currentValue: 'stderr',         category: 'Logging',              description: 'Sets the destination for server log output' },
  { name: 'log_duration',                       currentValue: 'off',            category: 'Logging',              description: 'Logs the duration of each completed SQL statement' },
  { name: 'log_line_prefix',                    currentValue: '%m [%p]',        category: 'Logging',              description: 'Controls information prefixed to each log line' },
  { name: 'log_min_duration_statement',         currentValue: '-1',             category: 'Logging',              description: 'Sets the minimum execution time above which all statements will be logged' },
  { name: 'log_min_messages',                   currentValue: 'warning',        category: 'Logging',              description: 'Sets the message levels that are logged' },
  { name: 'log_statement',                      currentValue: 'none',           category: 'Logging',              description: 'Sets the type of statements logged' },
  { name: 'maintenance_work_mem',               currentValue: '65536',          category: 'Resource Usage',       description: 'Sets the maximum memory to be used for maintenance operations' },
  { name: 'max_connections',                    currentValue: '100',            category: 'Connections and Authentication', description: 'Sets the maximum number of concurrent connections' },
  { name: 'max_locks_per_transaction',          currentValue: '64',             category: 'Lock Management',      description: 'Sets the maximum number of locks per transaction' },
  { name: 'max_parallel_workers',               currentValue: '8',              category: 'Resource Usage',       description: 'Sets the maximum number of parallel workers that can be active at one time' },
  { name: 'max_parallel_workers_per_gather',    currentValue: '2',              category: 'Resource Usage',       description: 'Sets the maximum number of parallel processes per executor node' },
  { name: 'max_wal_size',                       currentValue: '1024',           category: 'Write-Ahead Log',      description: 'Sets the WAL size that triggers a checkpoint' },
  { name: 'max_worker_processes',               currentValue: '8',              category: 'Resource Usage',       description: 'Maximum number of concurrent worker processes' },
  { name: 'min_wal_size',                       currentValue: '80',             category: 'Write-Ahead Log',      description: 'Sets the minimum size to shrink the WAL to' },
  { name: 'random_page_cost',                   currentValue: '4',              category: 'Query Tuning',         description: 'Sets the planner\'s estimate of the cost of a nonsequentially fetched disk page' },
  { name: 'seq_page_cost',                      currentValue: '1',              category: 'Query Tuning',         description: 'Sets the planner\'s estimate of the cost of a sequentially fetched disk page' },
  { name: 'shared_buffers',                     currentValue: '16384',          category: 'Resource Usage',       description: 'Sets the number of shared memory buffers used by the server' },
  { name: 'synchronous_commit',                 currentValue: 'on',             category: 'Write-Ahead Log',      description: 'Sets the current transaction\'s synchronization level' },
  { name: 'temp_buffers',                       currentValue: '1024',           category: 'Resource Usage',       description: 'Sets the maximum number of temporary buffers used by each session' },
  { name: 'track_activities',                   currentValue: 'on',             category: 'Statistics',           description: 'Collects information about executing commands' },
  { name: 'track_counts',                       currentValue: 'on',             category: 'Statistics',           description: 'Collects statistics on database activity' },
  { name: 'wal_buffers',                        currentValue: '512',            category: 'Write-Ahead Log',      description: 'Sets the number of disk-page buffers in shared memory for WAL' },
  { name: 'wal_compression',                    currentValue: 'off',            category: 'Write-Ahead Log',      description: 'Compresses full-page writes written in WAL file' },
  { name: 'wal_level',                          currentValue: 'replica',        category: 'Write-Ahead Log',      description: 'Set the level of information written to the WAL' },
  { name: 'wal_log_hints',                      currentValue: 'off',            category: 'Write-Ahead Log',      description: 'Writes full pages to WAL when first modified after a checkpoint' },
  { name: 'wal_writer_delay',                   currentValue: '200',            category: 'Write-Ahead Log',      description: 'Time between WAL flushes performed in the WAL writer' },
  { name: 'work_mem',                           currentValue: '4096',           category: 'Resource Usage',       description: 'Sets the maximum memory to be used for query workspaces' },
]

// 날짜만 추출: YYYY-MM-DD
function fmtDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// 파라미터 탭 전용 시간 범위 (일 단위)
const PARAM_TIME_RANGES: TimeRange[] = [
  { id: '1d',  label: '지난 1일',  shortLabel: '1d',  ms: 1  * 86400000 },
  { id: '3d',  label: '지난 3일',  shortLabel: '3d',  ms: 3  * 86400000 },
  { id: '7d',  label: '지난 7일',  shortLabel: '7d',  ms: 7  * 86400000 },
  { id: '14d', label: '지난 14일', shortLabel: '14d', ms: 14 * 86400000 },
  { id: '30d', label: '지난 30일', shortLabel: '30d', ms: 30 * 86400000 },
]

// 파라미터 탭 전용 필터 필드
const PARAM_FILTER_FIELDS = [
  { key: 'name',         label: 'Parameter Name', isDefault: true  },
  { key: 'currentValue', label: 'Current Value',  isDefault: true  },
  { key: 'category',     label: 'Category',       isDefault: false },
  { key: 'description',  label: 'Description',    isDefault: false },
]

// 파라미터별 변경 이력 씨앗 (daysAgo 기준)
const PARAM_CHANGE_SEEDS: Record<string, Array<{ daysAgo: number; old: string; new: string }>> = {
  max_connections:      [{ daysAgo: 2,  old: '50',       new: '100'     }, { daysAgo: 10, old: '200',     new: '50'      }],
  shared_buffers:       [{ daysAgo: 5,  old: '8192',     new: '16384'   }],
  work_mem:             [{ daysAgo: 1,  old: '2048',     new: '4096'    }, { daysAgo: 8,  old: '1024',    new: '2048'    }],
  log_min_messages:     [{ daysAgo: 3,  old: 'debug',    new: 'warning' }],
  autovacuum:           [{ daysAgo: 7,  old: 'off',      new: 'on'      }],
  checkpoint_timeout:   [{ daysAgo: 14, old: '600',      new: '300'     }],
  effective_cache_size: [{ daysAgo: 6,  old: '262144',   new: '524288'  }],
  maintenance_work_mem: [{ daysAgo: 4,  old: '32768',    new: '65536'   }],
  max_wal_size:         [{ daysAgo: 9,  old: '512',      new: '1024'    }],
  random_page_cost:     [{ daysAgo: 20, old: '4',        new: '2'       }, { daysAgo: 25, old: '2', new: '4' }],
  log_statement:        [{ daysAgo: 12, old: 'all',      new: 'none'    }],
  archive_mode:         [{ daysAgo: 30, old: 'on',       new: 'off'     }],
  synchronous_commit:   [{ daysAgo: 15, old: 'off',      new: 'on'      }],
  wal_level:            [{ daysAgo: 22, old: 'logical',  new: 'replica' }],
}

interface ParamDailyRow { date: string; currentValue: string; prevValue: string; different: boolean }

function genParamDailyRows(param: ParamRow, startMs: number, endMs: number): ParamDailyRow[] {
  const seeds = PARAM_CHANGE_SEEDS[param.name] ?? []
  const now   = new Date()

  // 각 씨앗을 날짜 기준으로 변환 (daysAgo → date string)
  const changeMap = new Map<string, { before: string; after: string }>()
  seeds.forEach(s => {
    const d = new Date(now.getTime() - s.daysAgo * 86400000)
    changeMap.set(fmtDay(d), { before: s.old, after: s.new })
  })

  // startMs~endMs 사이 날짜별로 rows 생성 (역순)
  const rows: ParamDailyRow[] = []
  let cursor = new Date(endMs)
  cursor.setHours(0, 0, 0, 0)
  const startDay = new Date(startMs)
  startDay.setHours(0, 0, 0, 0)

  let runningValue = param.currentValue

  while (cursor >= startDay) {
    const dayStr = fmtDay(cursor)
    const change = changeMap.get(dayStr)
    if (change) {
      rows.push({ date: dayStr, currentValue: change.after, prevValue: change.before, different: change.before !== change.after })
      runningValue = change.before
    } else {
      rows.push({ date: dayStr, currentValue: runningValue, prevValue: runningValue, different: false })
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return rows
}

function ParamDetailView({ param, onBack }: { param: ParamRow; onBack: () => void }) {
  const [timeRange, setTimeRange] = useState<TimeRange>(PARAM_TIME_RANGES[2]) // 기본 7일
  const [filters, setFilters]     = useState<FilterChip[]>([])
  const [filterMode, setFilterMode] = useState<'OR' | 'AND'>('OR')

  const now = new Date()
  const rangeEnd   = now
  const rangeStart = new Date(now.getTime() - timeRange.ms)

  const rows = useMemo(() => genParamDailyRows(param, rangeStart.getTime(), rangeEnd.getTime()), [param, timeRange])

  const applyFilter = (r: ParamDailyRow, f: FilterChip) => {
    const val  = String((r as any)[f.fieldKey] ?? '').toLowerCase()
    const fval = f.value.toLowerCase()
    switch (f.operator) {
      case '==':       return val === fval
      case '!=':       return val !== fval
      case 'like':     return val.includes(fval)
      case 'not like': return !val.includes(fval)
      default:         return true
    }
  }

  const displayed = useMemo(() => {
    if (filters.length === 0) return rows
    return filterMode === 'OR'
      ? rows.filter(r => filters.some(f  => applyFilter(r, f)))
      : rows.filter(r => filters.every(f => applyFilter(r, f)))
  }, [rows, filters, filterMode])

  const thS: React.CSSProperties = {
    background: '#f3f4f6', padding: '8px 12px', fontSize: 11, fontWeight: 600,
    color: '#374151', borderBottom: '1px solid #d1d5db', borderRight: '1px solid #e5e7eb',
    textAlign: 'center', whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 1,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>

      {/* ── 상단 헤더 바 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', marginBottom: 14, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onBack}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)', lineHeight: 1, padding: '0 4px' }}>
            ‹
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Parameter: {param.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TimeRangePicker
            selected={timeRange}
            onSelect={setTimeRange}
            paused={true}
            pausedAt={rangeEnd}
            ranges={PARAM_TIME_RANGES}
          />
          <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--card-bg)', cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)' }}>
            🕐 Slide History
          </button>
        </div>
      </div>

      {/* ── Information 섹션 ── */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 4, marginBottom: 16, flexShrink: 0, borderLeft: '3px solid #006DFF' }}>
        <div style={{ padding: '7px 14px', fontWeight: 700, fontSize: 12, borderBottom: '1px solid var(--border)', background: '#fafafa' }}>
          Information
        </div>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-muted)', width: 140, whiteSpace: 'nowrap' }}>Parameter Name</td>
              <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-primary)' }}>{param.name}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Description</td>
              <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-primary)' }}>{param.description || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Default</td>
              <td style={{ padding: '8px 14px', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ flex: 1, color: 'var(--text-primary)' }}>-</span>
                  <span style={{ marginRight: 40, fontSize: 12, color: 'var(--text-muted)' }}>Restart</span>
                  <span style={{ color: 'var(--text-primary)' }}>-</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Parameter List 섹션 ── */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 4, borderLeft: '3px solid #006DFF' }}>
        <div style={{ padding: '7px 14px', fontWeight: 700, fontSize: 12, borderBottom: '1px solid var(--border)', background: '#fafafa', flexShrink: 0 }}>
          Parameter List
        </div>

        {/* 필터 바 — ActiveSessionTab과 동일한 FilterBar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <select value={filterMode} onChange={e => setFilterMode(e.target.value as 'OR' | 'AND')}
            style={{ fontSize: 11, padding: '2px 4px', borderRadius: 3, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-primary)', cursor: 'pointer', flexShrink: 0 }}>
            <option value="OR">OR</option>
            <option value="AND">AND</option>
          </select>
          <FilterBar
            filters={filters}
            fields={[
              { key: 'date',         label: 'Date',          isDefault: true  },
              { key: 'currentValue', label: 'Current Value', isDefault: true  },
              { key: 'prevValue',    label: 'Prev Value',    isDefault: false },
            ]}
            onAdd={chip => setFilters(prev => [...prev, chip])}
            onRemove={id  => setFilters(prev => prev.filter(f => f.id !== id))}
            onClear={() => setFilters([])}
          />
        </div>

        {/* 테이블 */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ ...thS, width: '25%' }}>Date</th>
                <th style={{ ...thS, width: '25%' }}>Current Value</th>
                <th style={{ ...thS, width: '25%' }}>Prev Value</th>
                <th style={{ ...thS, width: '25%' }}>Different</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((r, i) => (
                <tr key={r.date + i}
                  style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.013)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,0,0,.04)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.013)' }}
                >
                  <td style={{ padding: '7px 12px', fontSize: 11, borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>{r.date}</td>
                  <td style={{ padding: '7px 12px', fontSize: 11, borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>{r.currentValue || ''}</td>
                  <td style={{ padding: '7px 12px', fontSize: 11, borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>{r.prevValue || ''}</td>
                  <td style={{ padding: '7px 12px', fontSize: 11, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 10px', fontSize: 11, borderRadius: 3,
                      border: `1px solid ${r.different ? '#059669' : '#dc2626'}`,
                      color: r.different ? '#059669' : '#dc2626',
                      fontWeight: 500,
                    }}>
                      {r.different ? 'True' : 'False'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ParameterTab() {
  const [filters, setFilters]             = useState<FilterChip[]>([])
  const [filterMode, setFilterMode]       = useState<'OR' | 'AND'>('OR')
  const [selectedParam, setSelectedParam] = useState<ParamRow | null>(null)

  const now = useMemo(() => fmtDate(new Date()), [])

  const applyFilter = (p: ParamRow, f: FilterChip) => {
    const val  = String((p as any)[f.fieldKey] ?? '').toLowerCase()
    const fval = f.value.toLowerCase()
    switch (f.operator) {
      case '==':       return val === fval
      case '!=':       return val !== fval
      case 'like':     return val.includes(fval)
      case 'not like': return !val.includes(fval)
      default:         return true
    }
  }

  const filtered = useMemo(() => {
    if (filters.length === 0) return PARAM_MOCK
    return filterMode === 'OR'
      ? PARAM_MOCK.filter(p => filters.some(f  => applyFilter(p, f)))
      : PARAM_MOCK.filter(p => filters.every(f => applyFilter(p, f)))
  }, [filters, filterMode])

  if (selectedParam) {
    return <ParamDetailView param={selectedParam} onBack={() => setSelectedParam(null)} />
  }

  const thS: React.CSSProperties = { background: '#f3f4f6', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#374151', borderBottom: '1px solid #d1d5db', borderRight: '1px solid #e5e7eb', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Parameter List</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{now}</span>
      </div>

      {/* 검색 바 — ActiveSessionTab과 동일한 FilterBar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <select
          value={filterMode}
          onChange={e => setFilterMode(e.target.value as 'OR' | 'AND')}
          style={{ fontSize: 11, padding: '3px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-primary)', cursor: 'pointer', flexShrink: 0 }}
        >
          <option value="OR">OR</option>
          <option value="AND">AND</option>
        </select>
        <FilterBar
          filters={filters}
          fields={PARAM_FILTER_FIELDS}
          onAdd={chip => setFilters(prev => [...prev, chip])}
          onRemove={id  => setFilters(prev => prev.filter(f => f.id !== id))}
          onClear={() => setFilters([])}
        />
        <button
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--card-bg)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          ↻ Get
        </button>
      </div>

      {/* 테이블 */}
      <div style={{ flex: 1, overflow: 'auto', border: '1px solid #d1d5db', borderRadius: 4 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ ...thS, width: '38%' }}>
                Parameter Name
                <span style={{ marginLeft: 4, fontSize: 10, color: '#9ca3af', cursor: 'pointer' }}>↕</span>
              </th>
              <th style={{ ...thS }}>Current Value</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr
                key={p.name}
                style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.013)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,0,0,.04)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.013)' }}
              >
                <td
                  style={{ padding: '7px 12px', fontSize: 12, color: '#006DFF', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', cursor: 'pointer', borderLeft: '3px solid #006DFF' }}
                  onClick={() => setSelectedParam(p)}
                >
                  {p.name}
                </td>
                <td style={{ padding: '7px 12px', fontSize: 12, color: p.currentValue ? '#111827' : '#9ca3af', borderBottom: '1px solid #e5e7eb' }}>
                  {p.currentValue || ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Host Process Tab ───────────────────────────────────────────────

interface HostProcess {
  pid:         number
  ppid:        number
  processName: string
  args:        string
  userName:    string
  startTime:   string
  cpu:         number
  virtualMem:  string
  realMem:     string
  cores:       number
}

const HOST_PROCESS_MOCK: HostProcess[] = [
  { pid: 32661, ppid: 20539, processName: 'postgres',          args: 'postgres: postgres DASH 127.0.0.1...', userName: 'shbank', startTime: '2026-03-06 15:33:56', cpu: 0,    virtualMem: '2.34 GiB',    realMem: '8.48 MiB',    cores: 4  },
  { pid: 32646, ppid: 1,     processName: 'oracle_32646_or',   args: 'oracleoracle19 (LOCAL=NO)',             userName: 'oracle', startTime: '2026-03-06 15:33:55', cpu: 0,    virtualMem: '9.85 GiB',    realMem: '31.76 MiB',   cores: 8  },
  { pid: 32633, ppid: 1,     processName: 'oracle_32633_or',   args: 'oracleoracle19 (LOCAL=NO)',             userName: 'oracle', startTime: '2026-03-06 15:33:55', cpu: 0,    virtualMem: '9.85 GiB',    realMem: '29.25 MiB',   cores: 8  },
  { pid: 32489, ppid: 1,     processName: 'java',              args: 'java -Xms1024m -Xmx1024m -DGT...',     userName: 'shbank', startTime: '2025-12-15 11:42:56', cpu: 0.1,  virtualMem: '6.52 GiB',    realMem: '437.95 MiB',  cores: 8  },
  { pid: 32487, ppid: 32466, processName: 'sqlservr',          args: '/opt/mssql/bin/sqlservr',              userName: 'mssql',  startTime: '2026-02-03 17:17:09', cpu: 0.25, virtualMem: '15.65 GiB',   realMem: '2.65 GiB',    cores: 8  },
  { pid: 32466, ppid: 1,     processName: 'sqlservr',          args: '/opt/mssql/bin/sqlservr',              userName: 'mssql',  startTime: '2026-02-03 17:17:08', cpu: 0,    virtualMem: '244.86 MiB',  realMem: '10.35 MiB',   cores: 8  },
  { pid: 32465, ppid: 1,     processName: 'ora_w00f_oracle19', args: 'ora_w00f_oracle19',                    userName: 'oracle', startTime: '2026-03-06 09:45:48', cpu: 0,    virtualMem: '9.85 GiB',    realMem: '217.87 MiB',  cores: 8  },
  { pid: 32404, ppid: 1,     processName: 'ora_w00e_oracle19', args: 'ora_w00e_oracle19',                    userName: 'oracle', startTime: '2026-03-06 09:45:45', cpu: 0,    virtualMem: '9.85 GiB',    realMem: '225.78 MiB',  cores: 8  },
  { pid: 32345, ppid: 1,     processName: 'ora_w00d_oracle19', args: 'ora_w00d_oracle19',                    userName: 'oracle', startTime: '2026-03-06 09:45:42', cpu: 0,    virtualMem: '9.86 GiB',    realMem: '273.82 MiB',  cores: 8  },
  { pid: 32284, ppid: 1,     processName: 'ora_w00c_oracle19', args: 'ora_w00c_oracle19',                    userName: 'oracle', startTime: '2026-03-06 09:45:39', cpu: 0,    virtualMem: '9.85 GiB',    realMem: '272.01 MiB',  cores: 8  },
  { pid: 32231, ppid: 1,     processName: 'ora_w00b_oracle19', args: 'ora_w00b_oracle19',                    userName: 'oracle', startTime: '2026-03-06 09:45:36', cpu: 0,    virtualMem: '9.85 GiB',    realMem: '265.32 MiB',  cores: 8  },
  { pid: 32171, ppid: 1,     processName: 'ora_w00a_oracle19', args: 'ora_w00a_oracle19',                    userName: 'oracle', startTime: '2026-03-06 09:45:33', cpu: 0,    virtualMem: '9.85 GiB',    realMem: '219.13 MiB',  cores: 8  },
  { pid: 32129, ppid: 1,     processName: 'ora_w009_oracle19', args: 'ora_w009_oracle19',                    userName: 'oracle', startTime: '2026-03-06 09:45:30', cpu: 0,    virtualMem: '9.85 GiB',    realMem: '220.90 MiB',  cores: 8  },
  { pid: 32095, ppid: 1,     processName: 'sshd',              args: '/usr/sbin/sshd -D',                    userName: 'root',   startTime: '2026-01-23 15:08:57', cpu: 0,    virtualMem: '110.35 MiB',  realMem: '388.00 KiB',  cores: 4  },
  { pid: 32081, ppid: 1,     processName: 'ora_w008_oracle19', args: 'ora_w008_oracle19',                    userName: 'oracle', startTime: '2026-03-06 09:45:27', cpu: 0,    virtualMem: '9.85 GiB',    realMem: '256.55 MiB',  cores: 8  },
  { pid: 32014, ppid: 31985, processName: 'java',              args: '/bin/java -Xms64m -jar /home/shb...',  userName: 'shbank', startTime: '2025-11-25 10:57:45', cpu: 0.03, virtualMem: '2.89 GiB',    realMem: '32.11 MiB',   cores: 8  },
  { pid: 32013, ppid: 31985, processName: 'java',              args: '/bin/java -DXM_SVC=exem_MFM_1...',    userName: 'shbank', startTime: '2025-11-25 10:57:45', cpu: 0.43, virtualMem: '7.63 GiB',    realMem: '421.63 MiB',  cores: 8  },
  { pid: 31985, ppid: 31810, processName: 'gather.start.sh',   args: '/bin/bash /home/shbank/EXEM/M...',     userName: 'shbank', startTime: '2025-11-25 10:57:45', cpu: 0,    virtualMem: '110.89 MiB',  realMem: '8.00 KiB',    cores: 4  },
  { pid: 31970, ppid: 1,     processName: 'ora_w007_oracle19', args: 'ora_w007_oracle19',                    userName: 'oracle', startTime: '2026-03-06 09:45:24', cpu: 0,    virtualMem: '9.85 GiB',    realMem: '259.19 MiB',  cores: 8  },
  { pid: 31889, ppid: 1,     processName: 'ora_w006_oracle19', args: 'ora_w006_oracle19',                    userName: 'oracle', startTime: '2026-03-06 09:45:21', cpu: 0,    virtualMem: '9.86 GiB',    realMem: '242.43 MiB',  cores: 8  },
  { pid: 31811, ppid: 31985, processName: 'java',              args: '/bin/java -Xms64m -jar /home/shb...',  userName: 'shbank', startTime: '2025-11-25 10:57:43', cpu: 0.03, virtualMem: '2.89 GiB',    realMem: '18.01 MiB',   cores: 8  },
  { pid: 31810, ppid: 31985, processName: 'java',              args: '/bin/java -DXM_SVC=exem_MFM_1...',    userName: 'shbank', startTime: '2025-11-25 10:57:43', cpu: 0.03, virtualMem: '3.52 GiB',    realMem: '74.97 MiB',   cores: 8  },
  { pid: 31665, ppid: 1,     processName: 'ora_w005_oracle19', args: 'ora_w005_oracle19',                    userName: 'oracle', startTime: '2026-03-06 09:45:18', cpu: 0,    virtualMem: '9.85 GiB',    realMem: '273.86 MiB',  cores: 8  },
  { pid: 31593, ppid: 1,     processName: 'sendmail',          args: 'sendmail: accepting connections',      userName: 'root',   startTime: '2025-09-12 10:50:57', cpu: 0,    virtualMem: '99.05 MiB',   realMem: '800.00 KiB',  cores: 4  },
  { pid: 31384, ppid: 1,     processName: 'java',              args: '/bin/java -Xms64m -jar /home/shb...',  userName: 'shbank', startTime: '2025-11-25 10:57:33', cpu: 0,    virtualMem: '2.89 GiB',    realMem: '27.48 MiB',   cores: 8  },
]

const PROC_FILTER_FIELDS = [
  { key: 'pid',         label: 'PID',          isDefault: true  },
  { key: 'processName', label: 'Process Name', isDefault: true  },
  { key: 'userName',    label: 'User Name',    isDefault: false },
  { key: 'args',        label: 'Args',         isDefault: false },
]

function genProcSeries(base: number, pts = 20, jitter = 0.3): { x: string; y: number }[] {
  const now = Date.now()
  return Array.from({ length: pts }, (_, i) => {
    const t = new Date(now - (pts - 1 - i) * 15000)
    const v = Math.max(0, base + (Math.random() - 0.5) * 2 * base * jitter)
    return { x: `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`, y: +v.toFixed(3) }
  })
}

function ProcMetricChart({ title, prefix, unit, series, color }: { title: string; prefix: string; unit: string; series: { x: string; y: number }[]; color: string }) {
  const vals = series.map(s => s.y)
  const max  = Math.max(...vals, 0.001)
  const option = {
    grid: { top: 8, right: 8, bottom: 28, left: 48 },
    xAxis: { type: 'category', data: series.map(s => s.x), axisLabel: { fontSize: 9, color: '#9ca3af', interval: 3 }, axisLine: { lineStyle: { color: '#e5e7eb' } }, axisTick: { show: false } },
    yAxis: { type: 'value', min: 0, max: +(max * 1.2).toFixed(3), axisLabel: { fontSize: 9, color: '#9ca3af', formatter: (v: number) => v === 0 ? '0' : v.toFixed(2) }, splitLine: { lineStyle: { color: '#f3f4f6' } } },
    series: [{ type: 'line', data: vals, smooth: true, symbol: 'none', lineStyle: { color, width: 1.5 }, areaStyle: { color: color + '22' } }],
    tooltip: { trigger: 'axis', textStyle: { fontSize: 11 } },
  }
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', background: 'var(--card-bg)' }}>
      <div style={{ fontSize: 11, marginBottom: 6, color: 'var(--text-muted)' }}>
        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: 3, fontSize: 10, marginRight: 6 }}>{prefix}</span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
        {unit && <span style={{ marginLeft: 4, fontSize: 10, color: '#9ca3af' }}>({unit})</span>}
      </div>
      <ReactECharts option={option} style={{ height: 120 }} />
    </div>
  )
}

function HostProcessDetailView({ proc, onBack }: { proc: HostProcess; onBack: () => void }) {
  const [timeRange, setTimeRange] = useState<TimeRange>(TIME_RANGES[0])
  const [paused, setPaused]       = useState(false)
  const [pausedAt, setPausedAt]   = useState<Date | undefined>(undefined)

  const handlePause = () => {
    if (paused) { setPaused(false); setPausedAt(undefined) }
    else        { setPaused(true);  setPausedAt(new Date())  }
  }

  const cpuBase  = proc.cpu || 0.05
  const vmBase   = parseFloat(proc.virtualMem)
  const rmBase   = parseFloat(proc.realMem)

  const cpuSeries  = useMemo(() => genProcSeries(cpuBase, 20, 0.5),   [proc.pid])
  const vmSeries   = useMemo(() => genProcSeries(vmBase,  20, 0.05),  [proc.pid])
  const rmSeries   = useMemo(() => genProcSeries(rmBase,  20, 0.08),  [proc.pid])
  const diskSeries = useMemo(() => genProcSeries(0.2,     20, 2.0),   [proc.pid])
  const hcpuSeries = useMemo(() => genProcSeries(18,      20, 0.4),   [proc.pid])
  const hmemSeries = useMemo(() => genProcSeries(62,      20, 0.1),   [proc.pid])

  const infoRows: [string, string][] = [
    ['PID',          String(proc.pid)],
    ['PPID',         String(proc.ppid)],
    ['Process Name', proc.processName],
    ['Args',         proc.args],
    ['User Name',    proc.userName],
    ['Start Time',   proc.startTime],
    ['Cores',        String(proc.cores)],
  ]

  const limitRows = [
    { name: 'Max address space', soft: 'unlimited', hard: 'unlimited', unit: 'bytes'   },
    { name: 'Max core file size', soft: '0',        hard: 'unlimited', unit: 'bytes'   },
    { name: 'Max cpu time',       soft: 'unlimited', hard: 'unlimited', unit: 'seconds' },
  ]

  const thS: React.CSSProperties = {
    background: '#f3f4f6', padding: '8px 14px', fontSize: 11, fontWeight: 600,
    color: '#374151', borderBottom: '1px solid #d1d5db', borderRight: '1px solid #e5e7eb',
    textAlign: 'center', whiteSpace: 'nowrap',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--border)', marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onBack}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', lineHeight: 1, padding: '0 2px' }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 600 }}>프로세스 상세: {proc.processName}</span>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--card-bg)', cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)' }}>
          🕐 Slide History
        </button>
      </div>

      {/* 정보 섹션 */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 4, marginBottom: 16, borderLeft: '3px solid #006DFF' }}>
        <div style={{ padding: '7px 14px', fontWeight: 700, fontSize: 12, borderBottom: '1px solid var(--border)', background: '#fafafa' }}>정보</div>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            {infoRows.map(([k, v]) => (
              <tr key={k} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '7px 16px', fontSize: 12, color: 'var(--text-muted)', width: 160, whiteSpace: 'nowrap' }}>{k}</td>
                <td style={{ padding: '7px 16px', fontSize: 12, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 리소스 한계 테이블 */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 4, marginBottom: 16, overflow: 'hidden' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ ...thS, textAlign: 'left', width: '40%' }}>Limit Name</th>
              <th style={{ ...thS }}>Soft Limit</th>
              <th style={{ ...thS }}>Hard Limit</th>
              <th style={{ ...thS }}>Units</th>
            </tr>
          </thead>
          <tbody>
            {limitRows.map((r, i) => (
              <tr key={r.name} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.013)', borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '7px 14px', fontSize: 12 }}>{r.name}</td>
                <td style={{ padding: '7px 14px', fontSize: 12, textAlign: 'right', color: 'var(--text-muted)' }}>{r.soft}</td>
                <td style={{ padding: '7px 14px', fontSize: 12, textAlign: 'right', color: 'var(--text-muted)' }}>{r.hard}</td>
                <td style={{ padding: '7px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{r.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 지표 섹션 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>지표</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TimeRangePicker selected={timeRange} onSelect={setTimeRange} paused={paused} pausedAt={pausedAt} />
            <button
              onClick={() => { if (!paused) { setPaused(true); setPausedAt(new Date(Date.now() - timeRange.ms)) } else { setPausedAt(prev => prev ? new Date(prev.getTime() - timeRange.ms) : new Date(Date.now() - timeRange.ms * 2)) } }}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="이전 구간">◁◁</button>
            <button onClick={handlePause}
              style={{ background: paused ? 'rgba(0,109,255,.15)' : 'none', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: 13, color: paused ? '#006DFF' : 'var(--text-muted)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={paused ? '재개' : '일시정지'}>{paused ? '▶' : '⏸'}</button>
            <button
              onClick={() => { if (paused) { const next = new Date((pausedAt ?? new Date()).getTime() + timeRange.ms); if (next <= new Date()) { setPausedAt(next) } else { setPaused(false); setPausedAt(undefined) } } }}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="다음 구간">▷▷</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <ProcMetricChart title="CPU"            prefix="Process" unit=""    series={cpuSeries}  color="#22c55e" />
          <ProcMetricChart title="Virtual Memory" prefix="Process" unit="GiB" series={vmSeries}   color="#22c55e" />
          <ProcMetricChart title="Real Memory"    prefix="Process" unit="GiB" series={rmSeries}   color="#22c55e" />
          <ProcMetricChart title="Disk"           prefix="Process" unit="MiB" series={diskSeries} color="#3b82f6" />
          <ProcMetricChart title="CPU Usage (%)"  prefix="Host"    unit="%"   series={hcpuSeries} color="#22c55e" />
          <ProcMetricChart title="Memory Usage (%)" prefix="Host"  unit="%"   series={hmemSeries} color="#22c55e" />
        </div>
      </div>
    </div>
  )
}

function HostProcessTab() {
  const [filters, setFilters]       = useState<FilterChip[]>([])
  const [filterMode, setFilterMode] = useState<'OR' | 'AND'>('OR')
  const [detailProc, setDetailProc] = useState<HostProcess | null>(null)
  const [paused, setPaused]         = useState(false)
  const [frozenAt, setFrozenAt]     = useState<Date | null>(null)
  const [now, setNow]               = useState(() => new Date())

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setNow(new Date()), 5000)
    return () => clearInterval(t)
  }, [paused])

  const handlePause = () => {
    if (paused) { setPaused(false); setFrozenAt(null) }
    else        { setPaused(true);  setFrozenAt(new Date()) }
  }

  const displayTime = paused && frozenAt ? fmtDate(frozenAt) : fmtDate(now)

  if (detailProc) {
    return <HostProcessDetailView proc={detailProc} onBack={() => setDetailProc(null)} />
  }

  const applyFilter = (p: HostProcess, f: FilterChip) => {
    const val  = String((p as any)[f.fieldKey] ?? '').toLowerCase()
    const fval = f.value.toLowerCase()
    switch (f.operator) {
      case '==':       return val === fval
      case '!=':       return val !== fval
      case 'like':     return val.includes(fval)
      case 'not like': return !val.includes(fval)
      default:         return true
    }
  }

  const displayed = filters.length === 0 ? HOST_PROCESS_MOCK
    : filterMode === 'OR'
      ? HOST_PROCESS_MOCK.filter(p => filters.some(f  => applyFilter(p, f)))
      : HOST_PROCESS_MOCK.filter(p => filters.every(f => applyFilter(p, f)))

  const cols: { key: keyof HostProcess; label: string; w: number; align?: 'right' | 'center' }[] = [
    { key: 'pid',         label: 'PID',            w: 72,  align: 'right'  },
    { key: 'ppid',        label: 'PPID',           w: 72,  align: 'right'  },
    { key: 'processName', label: 'Process Name',   w: 160                  },
    { key: 'args',        label: 'Args',           w: 280                  },
    { key: 'userName',    label: 'User Name',      w: 88                   },
    { key: 'startTime',   label: 'Start Time',     w: 148                  },
    { key: 'cpu',         label: 'CPU (%)',        w: 80,  align: 'right'  },
    { key: 'virtualMem',  label: 'Virtual Memory', w: 100, align: 'right'  },
    { key: 'realMem',     label: 'Real Memory',    w: 100, align: 'right'  },
  ]

  const thStyle: React.CSSProperties = {
    padding: '7px 8px', fontSize: 11, fontWeight: 600,
    color: '#374151', background: '#e8eaed',
    borderBottom: '1px solid #d1d5db', borderRight: '1px solid #d1d5db',
    textAlign: 'center', lineHeight: 1.3,
    position: 'sticky', top: 0, zIndex: 1, whiteSpace: 'nowrap',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>

      {/* 헤더 바 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>프로세스 목록</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Live / Frozen 인디케이터 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--card-bg)', fontSize: 11 }}>
            {paused ? (
              <span style={{ color: 'var(--text-muted)' }}>⏸ {displayTime}</span>
            ) : (
              <>
                <span style={{ color: '#00C073', fontWeight: 600 }}>Live</span>
                <span style={{ color: 'var(--text-muted)' }}>{displayTime}</span>
              </>
            )}
          </div>
          {/* 정지 / 재개 버튼 */}
          <button
            onClick={handlePause}
            style={{ background: paused ? 'rgba(0,109,255,.15)' : 'none', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: 13, color: paused ? '#006DFF' : 'var(--text-muted)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={paused ? '재개' : '정지'}>{paused ? '▶' : '⏸'}</button>
        </div>
      </div>

      {/* 필터 바 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <select value={filterMode} onChange={e => setFilterMode(e.target.value as 'OR' | 'AND')}
          style={{ fontSize: 11, padding: '3px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-primary)', cursor: 'pointer', flexShrink: 0 }}>
          <option value="OR">OR</option>
          <option value="AND">AND</option>
        </select>
        <FilterBar
          filters={filters}
          fields={PROC_FILTER_FIELDS}
          onAdd={chip => setFilters(prev => [...prev, chip])}
          onRemove={id  => setFilters(prev => prev.filter(f => f.id !== id))}
          onClear={() => setFilters([])}
        />
      </div>

      {/* 테이블 */}
      <div style={{ flex: 1, overflow: 'auto', border: '1px solid #d1d5db', borderRadius: 4 }}>
        <table style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%' }}>
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.key} style={{ ...thStyle, minWidth: c.w, textAlign: c.align === 'right' ? 'right' : 'center' }}>
                  {c.label}
                  {(c.key === 'pid' || c.key === 'cpu') && <span style={{ marginLeft: 3, fontSize: 9, color: '#9ca3af', cursor: 'pointer' }}>↕</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((p, i) => (
              <tr key={p.pid}
                style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.013)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,0,0,.04)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.013)' }}
              >
                {cols.map(c => {
                  const val = p[c.key]
                  const isPid = c.key === 'pid'
                  const isCpu = c.key === 'cpu'
                  return (
                    <td key={c.key} style={{
                      padding: '6px 8px', fontSize: 11,
                      color: isPid ? '#006DFF' : '#111827',
                      borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      maxWidth: c.w, cursor: isPid ? 'pointer' : 'default',
                      textAlign: c.align ?? 'left',
                    }}
                      onClick={isPid ? () => setDetailProc(p) : undefined}
                    >
                      {isCpu ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3, minWidth: 40 }}>
                            <div style={{ width: `${Math.min(100, (p.cpu / 2) * 100)}%`, height: '100%', background: p.cpu > 0.5 ? '#ef4444' : '#22c55e', borderRadius: 3 }} />
                          </div>
                          <span style={{ minWidth: 28, textAlign: 'right' }}>{p.cpu}</span>
                        </div>
                      ) : String(val)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}