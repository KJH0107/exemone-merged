'use client'
import type { DbInstance, DbMetric, SessionDistribution, TopSqlItem, SlowQueryItem, TablespaceItem } from '@/types/db.types'

interface Props {
  activePage: string
  highlightFeature: string | null
  instances: DbInstance[]
  metric: DbMetric
  sessionDist: SessionDistribution
  topSql: TopSqlItem[]
  slowQuery: SlowQueryItem[]
  tablespace: TablespaceItem[]
}

const STATUS_COLOR: Record<string, string> = {
  active: '#006DFF',
  warning: '#f59e0b',
  critical: '#ef4444',
  nosignal: '#9fa5ae',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Active', warning: 'Warning', critical: 'Critical', nosignal: 'No Signal',
}
const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  active:   { bg: '#dbeafe', color: '#1d4ed8' },
  warning:  { bg: '#fef3c7', color: '#b45309' },
  critical: { bg: '#fee2e2', color: '#dc2626' },
  nosignal: { bg: '#f1f5f9', color: '#64748b' },
}

// ── 하이라이트 래퍼 ─────────────────────────────────────────────
// 기능 선택 시 오버레이(z-index:10) 위로 올라와 spotlight 효과
function Highlight({ id, hl, children, style }: {
  id: string; hl: string | null; children: React.ReactNode; style?: React.CSSProperties
}) {
  const isActive = hl === id
  return (
    <div style={{
      ...style, position: 'relative',
      zIndex: isActive ? 20 : undefined,         // 오버레이(z:10) 위로
      outline: isActive ? '3px solid #3b82f6' : 'none',
      outlineOffset: isActive ? 4 : 0,
      borderRadius: 8,
      boxShadow: isActive ? '0 0 0 9999px rgba(15,23,42,0)' : undefined,
      transition: 'outline .2s, box-shadow .2s',
    }}>
      {isActive && (
        <div style={{
          position: 'absolute', top: -30, left: 0, zIndex: 21,
          background: '#3b82f6', color: '#fff',
          fontSize: 11, fontWeight: 700, padding: '4px 12px',
          borderRadius: '6px 6px 0 0', whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: '0 -2px 8px rgba(59,130,246,.4)',
        }}>
          👆 여기를 확인하세요
        </div>
      )}
      {children}
    </div>
  )
}

export default function GuidePreview({ activePage, highlightFeature: hl, instances, metric, sessionDist, topSql, slowQuery, tablespace }: Props) {
  if (activePage === 'home') return <HomePreview instances={instances} metric={metric} hl={hl} />
  if (activePage === 'database') return <DatabasePreview instances={instances} hl={hl} />
  if (activePage === 'performance') return <PerformancePreview metric={metric} sessionDist={sessionDist} topSql={topSql} slowQuery={slowQuery} tablespace={tablespace} hl={hl} />
  if (activePage === 'alert') return <AlertPreview hl={hl} />
  return <HomePreview instances={instances} metric={metric} hl={hl} />
}

// ═══════════════════════════════════════════════════════════════
// HOME
// ═══════════════════════════════════════════════════════════════
function HomePreview({ instances, metric, hl }: { instances: DbInstance[]; metric: DbMetric; hl: string | null }) {
  const counts = summarize(instances)
  const criticalList = instances.filter(i => i.status === 'critical').slice(0, 5)

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* 상태 요약 카드 */}
      <Highlight id="status-summary" hl={hl}>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: '전체', value: counts.total, color: '#282c32', bg: '#fff' },
            { label: 'Active', value: counts.active, color: '#006DFF', bg: '#eff6ff' },
            { label: 'Warning', value: counts.warning, color: '#d97706', bg: '#fffbeb' },
            { label: 'Critical', value: counts.critical, color: '#dc2626', bg: '#fef2f2' },
            { label: 'No Signal', value: counts.nosignal, color: '#9fa5ae', bg: '#f8fafc' },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: s.bg, borderRadius: 8,
              padding: '12px 10px', textAlign: 'center',
              border: '1px solid #e3e7ea', cursor: 'pointer',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#80868f', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Highlight>

      {/* 화면 커스텀 버튼 + 메트릭 행 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        <Highlight id="widget-custom" hl={hl}>
          <button style={{
            fontSize: 11, color: '#626872', background: '#fff',
            border: '1px solid #c9cdd2', borderRadius: 5,
            padding: '4px 12px', cursor: 'pointer',
          }}>
            ⚙ 화면 커스텀
          </button>
        </Highlight>
        <button style={{
          fontSize: 11, color: '#626872', background: '#fff',
          border: '1px solid #c9cdd2', borderRadius: 5,
          padding: '4px 12px', cursor: 'pointer',
        }}>
          ? 시작 가이드
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <MetricCard label="CPU 평균" value={`${Math.round(metric.cpuUsage)}%`} color={metric.cpuUsage > 70 ? '#dc2626' : '#059669'} />
        <MetricCard label="Memory" value={`${Math.round((metric.memoryUsed / metric.memoryTotal) * 100)}%`} color="#0369a1" />
        <MetricCard label="활성 세션" value={metric.activeSessions} color="#1d4ed8" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
        {/* 알람 현황 */}
        <Highlight id="realtime-alert" hl={hl}>
          <Card title="🔔 실시간 알람 현황" style={{ height: 200 }}>
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <AlertSummaryRow label="Critical" value={2} color="#dc2626" bg="#fee2e2" />
              <AlertSummaryRow label="Warning" value={3} color="#d97706" bg="#fef3c7" />
              <AlertSummaryRow label="Info" value={1} color="#1d4ed8" bg="#eff6ff" />
              <div style={{ marginTop: 6 }}>
                <button style={{
                  width: '100%', padding: '6px', fontSize: 11, cursor: 'pointer',
                  background: '#f8fafc', border: '1px solid #e3e7ea', borderRadius: 6, color: '#374151',
                }}>
                  알람 상세 보기 →
                </button>
              </div>
            </div>
          </Card>
        </Highlight>

        {/* 최근 방문 대시보드 + 알람 요약 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Highlight id="recent-dashboard" hl={hl}>
            <Card title="📊 최근 방문 대시보드">
              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['DB 성능 대시보드', 'Oracle 전용 뷰', 'DBA 운영 현황'].map(d => (
                  <div key={d} style={{
                    fontSize: 12, padding: '5px 8px', borderRadius: 5,
                    background: '#f8fafc', color: '#282c32', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    {d}
                    <span style={{ fontSize: 10, color: '#9fa5ae' }}>⭐</span>
                  </div>
                ))}
              </div>
            </Card>
          </Highlight>

          <Highlight id="alert-summary" hl={hl}>
            <Card title="📋 최근 알람 요약">
              <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <select style={{ fontSize: 11, border: '1px solid #c9cdd2', borderRadius: 4, padding: '3px 6px', color: '#374151' }}>
                  <option>오늘</option><option>7일</option><option>30일</option>
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ v: 6, c: '#dc2626', l: 'Critical' }, { v: 9, c: '#d97706', l: 'Warning' }, { v: 3, c: '#1d4ed8', l: 'Info' }].map(s => (
                    <div key={s.l} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</div>
                      <div style={{ fontSize: 10, color: '#80868f' }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </Highlight>
        </div>
      </div>

      {/* 장애 인스턴스 목록 */}
      <Highlight id="critical-list" hl={hl}>
        <Card title="🚨 장애 인스턴스">
          {criticalList.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#10b981', fontSize: 12 }}>✅ 장애 인스턴스 없음</div>
          ) : (
            criticalList.map(inst => (
              <div key={inst.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 14px', borderBottom: '1px solid #f3f4f6',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#282c32' }}>{inst.name}</span>
                <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>CPU {inst.cpuUsage}%</span>
              </div>
            ))
          )}
        </Card>
      </Highlight>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DATABASE (오버뷰)
// ═══════════════════════════════════════════════════════════════
function DatabasePreview({ instances, hl }: { instances: DbInstance[]; hl: string | null }) {
  const counts = summarize(instances)
  const tableList = [...instances].sort((a, b) => b.cpuUsage - a.cpuUsage).slice(0, 10)

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Instance Card */}
      <Highlight id="instance-card" hl={hl}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: '전체 DB', value: counts.total, color: '#282c32', bg: '#fff' },
            { label: 'Active', value: counts.active, color: '#006DFF', bg: '#eff6ff' },
            { label: 'Warning', value: counts.warning, color: '#d97706', bg: '#fffbeb' },
            { label: 'Critical', value: counts.critical, color: '#dc2626', bg: '#fef2f2' },
            { label: 'No Signal', value: counts.nosignal, color: '#9fa5ae', bg: '#f8fafc' },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: s.bg, borderRadius: 7, padding: '10px 8px',
              border: `1.5px solid ${s.color === '#282c32' ? '#e3e7ea' : s.color + '40'}`,
              textAlign: 'center', cursor: 'pointer',
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#80868f', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Highlight>

      {/* Filters + Instance Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 10 }}>

        {/* Filters */}
        <Highlight id="filters" hl={hl}>
          <Card title="Filters" style={{ height: 260 }}>
            <div style={{ padding: '8px 10px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#80868f', marginBottom: 6 }}>DB 타입</div>
              {['All', 'PostgreSQL', 'MySQL', 'Oracle', 'SQL Server', 'MongoDB', 'Tibero'].map((t, i) => (
                <div key={t} style={{
                  fontSize: 11, padding: '4px 6px', borderRadius: 4, cursor: 'pointer',
                  background: i === 0 ? '#dbeafe' : 'transparent',
                  color: i === 0 ? '#1d4ed8' : '#374151',
                  fontWeight: i === 0 ? 600 : 400, marginBottom: 2,
                }}>{t}</div>
              ))}
              <div style={{ height: 1, background: '#e3e7ea', margin: '8px 0' }} />
              <div style={{ fontSize: 10, fontWeight: 700, color: '#80868f', marginBottom: 6 }}>그룹</div>
              {['All', 'DB demo1', 'DB demo2', 'azure'].map((g, i) => (
                <div key={g} style={{
                  fontSize: 11, padding: '4px 6px', borderRadius: 4, cursor: 'pointer',
                  background: i === 0 ? '#dbeafe' : 'transparent',
                  color: i === 0 ? '#1d4ed8' : '#374151',
                  fontWeight: i === 0 ? 600 : 400, marginBottom: 2,
                }}>{g}</div>
              ))}
            </div>
          </Card>
        </Highlight>

        {/* Instance Map */}
        <Highlight id="instance-map" hl={hl}>
          <Card title="Instance Map" style={{ height: 260 }}>
            <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {instances.map(inst => (
                <div key={inst.id}
                  title={`${inst.name}\n${inst.dbType} | ${inst.group}\nCPU: ${inst.cpuUsage}% | MEM: ${inst.memoryUsage}%`}
                  style={{
                    width: 38, height: 38, borderRadius: 8,
                    background: STATUS_COLOR[inst.status],
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, color: '#fff', fontWeight: 700, cursor: 'pointer',
                    opacity: inst.status === 'nosignal' ? 0.5 : 1,
                    boxShadow: inst.status === 'critical' ? '0 0 8px rgba(239,68,68,.6)' : '0 1px 3px rgba(0,0,0,.12)',
                    transition: 'transform .1s',
                  }}
                >
                  <div>{inst.dbType.slice(0, 2).toUpperCase()}</div>
                  <div style={{ opacity: 0.85 }}>{inst.cpuUsage}%</div>
                </div>
              ))}
            </div>
          </Card>
        </Highlight>
      </div>

      {/* Instance List */}
      <Highlight id="instance-list" hl={hl}>
        <Card title="Instance List">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#edf0f2' }}>
                {['인스턴스', 'DB 타입', '그룹', 'CPU ↓', 'Memory', '세션', '상태'].map(h => (
                  <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600, color: '#626872', cursor: 'pointer', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableList.map((inst, i) => (
                <tr key={inst.id} style={{
                  borderBottom: '1px solid #f3f4f6',
                  background: i % 2 === 0 ? '#fff' : '#fafbfc',
                  cursor: 'pointer',
                }}>
                  <td style={{ padding: '7px 12px', fontWeight: 600, color: '#1d4ed8' }}>{inst.name}</td>
                  <td style={{ padding: '7px 12px', color: '#626872' }}>{inst.dbType}</td>
                  <td style={{ padding: '7px 12px', color: '#626872' }}>{inst.group}</td>
                  <td style={{ padding: '7px 12px' }}><CpuBar value={inst.cpuUsage} /></td>
                  <td style={{ padding: '7px 12px' }}><CpuBar value={inst.memoryUsage} color="#9BD9FF" /></td>
                  <td style={{ padding: '7px 12px', color: '#282c32' }}>{inst.activeSessionCount}</td>
                  <td style={{ padding: '7px 12px' }}>
                    <span style={{ ...STATUS_BADGE[inst.status], fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>
                      {STATUS_LABEL[inst.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Highlight>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PERFORMANCE
// ═══════════════════════════════════════════════════════════════
function PerformancePreview({ metric, sessionDist, topSql, slowQuery, tablespace, hl }: {
  metric: DbMetric; sessionDist: SessionDistribution; topSql: TopSqlItem[]
  slowQuery: SlowQueryItem[]; tablespace: TablespaceItem[]; hl: string | null
}) {
  const total = sessionDist.active + sessionDist.idle + sessionDist.lock + sessionDist.long

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* 트렌드 차트 */}
      <Highlight id="trend-chart" hl={hl}>
        <Card title="트렌드 차트 — CPU / TPS">
          <div style={{ padding: '12px 16px', height: 110, position: 'relative' }}>
            <MiniLineChart cpuBase={metric.cpuUsage} tpsBase={metric.tps} />
            <div style={{ position: 'absolute', bottom: 14, right: 16, display: 'flex', gap: 8 }}>
              {['10분', '30분', '1시간', '3시간'].map((t, i) => (
                <button key={t} style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 4, cursor: 'pointer',
                  background: i === 1 ? '#dbeafe' : '#f1f5f9',
                  border: i === 1 ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                  color: i === 1 ? '#1d4ed8' : '#64748b',
                }}>{t}</button>
              ))}
            </div>
          </div>
        </Card>
      </Highlight>

      {/* 세션 분포 */}
      <Highlight id="session-dist" hl={hl}>
        <Card title="세션 분포">
          <div style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', height: 22, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
              {[
                { label: 'Active', value: sessionDist.active, color: '#006DFF' },
                { label: 'Idle', value: sessionDist.idle, color: '#9BD9FF' },
                { label: 'Lock', value: sessionDist.lock, color: '#ef4444' },
                { label: 'Long', value: sessionDist.long, color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} style={{
                  width: `${(s.value / total) * 100}%`,
                  background: s.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#fff', fontWeight: 700,
                }}>{s.value > 8 ? s.value : ''}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
              {[
                { label: 'Active', value: sessionDist.active, color: '#006DFF' },
                { label: 'Idle', value: sessionDist.idle, color: '#9BD9FF' },
                { label: 'Lock', value: sessionDist.lock, color: '#ef4444' },
                { label: 'Long', value: sessionDist.long, color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                  <span style={{ color: '#626872' }}>{s.label}: </span>
                  <span style={{ fontWeight: 700, color: '#282c32' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </Highlight>

      {/* Top SQL */}
      <Highlight id="top-sql" hl={hl}>
        <Card title="Top SQL (실행횟수 기준)">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#edf0f2' }}>
                {['#', 'SQL', '실행횟수', '대기시간(ms)'].map(h => (
                  <th key={h} style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 600, color: '#626872' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topSql.map(row => (
                <tr key={row.rank} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>
                  <td style={{ padding: '6px 12px', fontWeight: 700, color: '#1d4ed8' }}>{row.rank}</td>
                  <td style={{ padding: '6px 12px', color: '#282c32', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.sqlText}</td>
                  <td style={{ padding: '6px 12px', fontWeight: 600 }}>{row.execCount.toLocaleString()}</td>
                  <td style={{ padding: '6px 12px', color: row.waitTime > 10000 ? '#dc2626' : '#626872', fontWeight: row.waitTime > 10000 ? 700 : 400 }}>
                    {row.waitTime.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Highlight>

      {/* Slow Query */}
      <Highlight id="slow-query" hl={hl}>
        <Card title={`Slow Query (${slowQuery.length}건)`}>
          {slowQuery.map((sq, i) => (
            <div key={i} style={{ padding: '8px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 10 }}>
              <div style={{
                flexShrink: 0, background: '#fee2e2', color: '#dc2626',
                fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, marginTop: 1,
              }}>{sq.queryTime}s</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#9fa5ae', marginBottom: 2 }}>{sq.userHost} · {sq.startTime}</div>
                <div style={{ fontSize: 11, color: '#282c32', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sq.sqlText}</div>
              </div>
            </div>
          ))}
        </Card>
      </Highlight>

      {/* Tablespace */}
      <Highlight id="tablespace" hl={hl}>
        <Card title="Tablespace 사용량">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#edf0f2' }}>
                {['DB', '테이블', '사용(MB)', '인덱스(MB)', '잔여(MB)', '사용률'].map(h => (
                  <th key={h} style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 600, color: '#626872' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tablespace.map((ts, i) => {
                const used = ts.dataLength + ts.indexLength
                const usageRate = Math.round((used / (used + ts.free)) * 100)
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '6px 12px', fontWeight: 600 }}>{ts.databaseName}</td>
                    <td style={{ padding: '6px 12px', color: '#626872' }}>{ts.tableName}</td>
                    <td style={{ padding: '6px 12px' }}>{ts.dataLength.toLocaleString()}</td>
                    <td style={{ padding: '6px 12px' }}>{ts.indexLength.toLocaleString()}</td>
                    <td style={{ padding: '6px 12px', color: ts.free < 200 ? '#dc2626' : '#282c32', fontWeight: ts.free < 200 ? 700 : 400 }}>
                      {ts.free.toLocaleString()}
                    </td>
                    <td style={{ padding: '6px 12px' }}><CpuBar value={usageRate} color="#8b5cf6" /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </Highlight>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ALERT
// ═══════════════════════════════════════════════════════════════
function AlertPreview({ hl }: { hl: string | null }) {
  const events = [
    { id: 'e1', rule: 'CPU 임계치 초과', inst: 'oracle-cr1', metric: 'CPU Usage (%)', value: 96.1, threshold: 85, sev: 'critical' as const, status: 'firing' as const, at: '2026-03-31 09:08:11' },
    { id: 'e2', rule: 'Memory 경고', inst: 'postgresql-w1', metric: 'Memory Usage (%)', value: 83.7, threshold: 80, sev: 'warning' as const, status: 'resolved' as const, at: '2026-03-31 08:55:40' },
    { id: 'e3', rule: '세션 과부하', inst: 'mysql-cr1', metric: 'Active Sessions', value: 22, threshold: 20, sev: 'critical' as const, status: 'acknowledged' as const, at: '2026-03-31 08:20:00' },
    { id: 'e4', rule: 'CPU 임계치 초과', inst: 'tibero-cr1', metric: 'CPU Usage (%)', value: 93.5, threshold: 85, sev: 'critical' as const, status: 'firing' as const, at: '2026-03-31 08:48:19' },
  ]
  const SEV = { critical: { bg: '#fee2e2', color: '#dc2626', label: 'Critical' }, warning: { bg: '#fef3c7', color: '#d97706', label: 'Warning' } }
  const STA = { firing: { bg: '#ef4444', color: '#fff', label: '발화 중' }, resolved: { bg: '#d1fae5', color: '#059669', label: '해소됨' }, acknowledged: { bg: '#fef3c7', color: '#b45309', label: '확인됨' } }

  const rules = [
    { name: 'CPU 임계치 초과', metric: 'CPU Usage (%)', op: '>', val: 85, sev: 'critical', on: true },
    { name: 'Memory 경고', metric: 'Memory Usage (%)', op: '>', val: 80, sev: 'warning', on: true },
    { name: '세션 과부하', metric: 'Active Sessions', op: '>=', val: 200, sev: 'critical', on: true },
    { name: 'TPS 급감', metric: 'TPS', op: '<', val: 50, sev: 'warning', on: false },
    { name: 'Tablespace 임박', metric: 'Tablespace Usage (%)', op: '>', val: 90, sev: 'critical', on: true },
  ]

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* 알람 현황 요약 */}
      <Highlight id="alert-status" hl={hl}>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: '발화 중', value: events.filter(e => e.status === 'firing').length, color: '#dc2626', bg: '#fef2f2' },
            { label: '확인됨', value: events.filter(e => e.status === 'acknowledged').length, color: '#d97706', bg: '#fffbeb' },
            { label: '해소됨', value: events.filter(e => e.status === 'resolved').length, color: '#059669', bg: '#f0fdf4' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 8, padding: '14px', border: `1px solid ${s.color}30`, textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#80868f', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Highlight>

      {/* 알람 이벤트 목록 */}
      <Highlight id="alert-event" hl={hl}>
        <Card title="알람 이벤트">
          {events.map(e => {
            const sev = SEV[e.sev]
            const sta = STA[e.status]
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ ...sev, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, flexShrink: 0 }}>{sev.label}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#282c32' }}>{e.rule}</div>
                  <div style={{ fontSize: 11, color: '#80868f' }}>{e.inst} · {e.metric}: <strong style={{ color: sev.color }}>{e.value}</strong> (임계: {e.threshold})</div>
                  <div style={{ fontSize: 10, color: '#9fa5ae' }}>{e.at}</div>
                </div>
                <span style={{ background: sta.bg, color: sta.color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, flexShrink: 0 }}>
                  {sta.label}
                </span>
              </div>
            )
          })}
        </Card>
      </Highlight>

      {/* 알람 규칙 */}
      <Highlight id="alert-rule" hl={hl}>
        <Card title="알람 규칙">
          <div style={{ padding: '8px 0' }}>
            {rules.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.on ? '#10b981' : '#d1d5db', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#282c32' }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: '#80868f' }}>{r.metric} {r.op} {r.val}</div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                  background: r.sev === 'critical' ? '#fee2e2' : '#fef3c7',
                  color: r.sev === 'critical' ? '#dc2626' : '#d97706',
                }}>
                  {r.sev === 'critical' ? 'Critical' : 'Warning'}
                </span>
                <button style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
                  background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b',
                }}>편집</button>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 14px' }}>
            <button style={{
              fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 6, cursor: 'pointer',
              background: '#3b82f6', color: '#fff', border: 'none',
            }}>+ 규칙 추가</button>
          </div>
        </Card>
      </Highlight>
    </div>
  )
}

// ── 공통 컴포넌트 ───────────────────────────────────────────────
function Card({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e3e7ea', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,13,29,.05)', ...style }}>
      <div style={{ padding: '8px 14px', borderBottom: '1px solid #e3e7ea', background: '#fafbfc', fontSize: 12, fontWeight: 700, color: '#282c32' }}>
        {title}
      </div>
      <div>{children}</div>
    </div>
  )
}

function MetricCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: '12px 14px', border: '1px solid #e3e7ea', boxShadow: '0 1px 4px rgba(0,13,29,.05)' }}>
      <div style={{ fontSize: 11, color: '#80868f', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

function CpuBar({ value, color = '#006DFF' }: { value: number; color?: string }) {
  const barColor = color === '#006DFF' ? (value > 85 ? '#ef4444' : value > 70 ? '#f59e0b' : '#006DFF') : color
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 60, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', background: barColor, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, color: barColor, fontWeight: 600 }}>{value}%</span>
    </div>
  )
}

function AlertSummaryRow({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', background: bg, borderRadius: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color }}>{value}</span>
    </div>
  )
}

function MiniLineChart({ cpuBase, tpsBase }: { cpuBase: number; tpsBase: number }) {
  const pts = 24
  const cpu = Array.from({ length: pts }, (_, i) => cpuBase + Math.sin(i * 0.7) * 10 + (i % 3 === 0 ? 5 : -2))
  const tps = Array.from({ length: pts }, (_, i) => (tpsBase / 500) * 90 + Math.sin(i * 0.5 + 1) * 8)
  const toPath = (data: number[]) =>
    data.map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i / (pts - 1)) * 400} ${Math.max(5, Math.min(85, y))}`).join(' ')
  return (
    <svg width="100%" height="88" viewBox="0 0 400 88" preserveAspectRatio="none">
      <path d={toPath(cpu)} fill="none" stroke="#006DFF" strokeWidth="2" />
      <path d={toPath(tps)} fill="none" stroke="#F9CB3B" strokeWidth="2" />
      <rect x="8" y="4" width="10" height="3" fill="#006DFF" rx="1" />
      <text x="22" y="10" fontSize="9" fill="#80868f">CPU</text>
      <rect x="52" y="4" width="10" height="3" fill="#F9CB3B" rx="1" />
      <text x="66" y="10" fontSize="9" fill="#80868f">TPS</text>
    </svg>
  )
}

function summarize(instances: DbInstance[]) {
  return {
    total: instances.length,
    active: instances.filter(i => i.status === 'active').length,
    warning: instances.filter(i => i.status === 'warning').length,
    critical: instances.filter(i => i.status === 'critical').length,
    nosignal: instances.filter(i => i.status === 'nosignal').length,
  }
}
