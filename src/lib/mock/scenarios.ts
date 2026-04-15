import type { DbInstance, DbType, InstanceStatus, SlowQueryItem, TablespaceItem } from '@/types/db.types'

// ── 인스턴스 생성 헬퍼 ──────────────────────────────────────────
function inst(
  id: string, name: string, dbType: DbType, status: InstanceStatus,
  group: string, cpu: number, mem: number, sessions: number,
  extra?: Partial<DbInstance>
): DbInstance {
  return {
    id, name, alias: extra?.alias ?? '', clusterNode: extra?.clusterNode ?? '',
    version: extra?.version ?? '', dbType, group, status,
    cpuUsage: cpu, memoryUsage: mem, activeSessionCount: sessions,
    monitoring: status !== 'nosignal',
    deployType: extra?.deployType ?? 'Single',
    hostIp: extra?.hostIp ?? `10.10.${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 200) + 10}`,
  }
}

// ── 시나리오 타입 ───────────────────────────────────────────────
export type ScenarioKey = 'normal' | 'critical' | 'slowquery' | 'disk'

export interface ScenarioMetrics {
  cpuAvg: number
  memAvg: number
  totalSessions: number
  activeSessions: number
  tps: number
  connectionUsage: number
}

export interface ScenarioSlowQuery extends SlowQueryItem {}

export interface Scenario {
  key: ScenarioKey
  label: string
  emoji: string
  badge: { bg: string; color: string }
  description: string
  instances: DbInstance[]
  metrics: ScenarioMetrics
  slowQueries: ScenarioSlowQuery[]
  tablespaces: TablespaceItem[]
  alerts: AlertEvent[]
  highlightMessage: string
  features: ScenarioFeature[]
}

export interface ScenarioFeature {
  id: string
  label: string
  area: string // 어느 화면 영역인지
  description: string
  tip: string
}

// ── Alert 이벤트 타입 (로컬) ────────────────────────────────────
export interface AlertEvent {
  id: string
  ruleName: string
  instanceName: string
  metric: string
  value: number
  threshold: number
  severity: 'critical' | 'warning' | 'info'
  status: 'firing' | 'resolved' | 'acknowledged'
  firedAt: string
  resolvedAt?: string
}

// ═══════════════════════════════════════════════════════════════
// SCENARIO 1: 정상 운영
// ═══════════════════════════════════════════════════════════════
const normalInstances: DbInstance[] = [
  inst('pg-01','postgresql-1','postgresql','active','DB demo3',18.2,42.1,2,{version:'14',hostIp:'10.10.48.55'}),
  inst('pg-02','postgresql-2','postgresql','active','DB demo3',12.1,38.4,1),
  inst('pg-03','postgresql-3','postgresql','active','DB demo4',22.4,51.2,3),
  inst('pg-04','postgresql-4','postgresql','active','DB demo4',8.2,33.7,0),
  inst('pg-05','postgresql-5','postgresql','active','DB demo5',14.6,44.0,2),
  inst('my-01','mysql-1','mysql','active','DB demo1',10.5,48.3,1),
  inst('my-02','mysql-2','mysql','active','DB demo1',19.2,55.1,3),
  inst('my-03','mysql-3','mysql','active','DB demo2',6.4,29.8,0),
  inst('my-04','mysql-4','mysql','active','DB demo2',24.1,62.3,4),
  inst('or-01','oracle-1','oracle','active','DB demo1',15.8,52.4,3),
  inst('or-02','oracle-2','oracle','active','DB demo2',11.3,44.7,1),
  inst('or-03','oracle-3','oracle','active','DB demo3',21.9,58.2,4),
  inst('ms-01','mssql-1','sqlserver','active','azure_sqlserver',9.3,40.1,1),
  inst('ms-02','mssql-2','sqlserver','active','azure_sqlserver',16.7,49.3,2),
  inst('ms-03','mssql-3','sqlserver','active','azure',13.8,45.6,1),
  inst('mg-01','mongodb-1','mongodb','active','EXEM Mongo',8.2,38.9,0),
  inst('mg-02','mongodb-2','mongodb','active','EXEM Mongo',14.5,46.4,2),
  inst('mg-03','mongodb-3','mongodb','active','EXEM Mongo',6.9,31.7,0),
  inst('rd-01','redis-1','redis','active','DB demo4',3.1,20.8,0),
  inst('rd-02','redis-2','redis','active','DB demo4',2.4,18.3,0),
  inst('rd-03','redis-3','redis','active','DB demo5',1.8,16.4,0),
  inst('tb-01','tibero-1','tibero','active','altibase',17.2,53.5,3),
  inst('tb-02','tibero-2','tibero','active','altibase',9.3,41.8,1),
  inst('cb-01','cubrid-1','cubrid','active','DB demo5',7.7,36.2,0),
  inst('pg-06','postgresql-6','postgresql','active','DB demo1',13.8,42.1,2),
  inst('my-05','mysql-5','mysql','active','DB demo3',20.6,54.3,3),
  inst('or-04','oracle-4','oracle','active','DB demo4',16.1,49.9,2),
  inst('ms-04','mssql-4','sqlserver','active','azure',7.6,34.4,0),
  // warning 2개
  inst('pg-w1','postgresql-w1','postgresql','warning','DB demo3',68.2,74.1,12),
  inst('my-w1','mysql-w1','mysql','warning','DB demo1',72.4,78.3,15),
]

// ═══════════════════════════════════════════════════════════════
// SCENARIO 2: Critical 장애
// ═══════════════════════════════════════════════════════════════
const criticalInstances: DbInstance[] = [
  // active
  inst('pg-01','postgresql-1','postgresql','active','DB demo3',37.9,69.4,5),
  inst('pg-02','postgresql-2','postgresql','active','DB demo3',22.1,55.2,2),
  inst('my-01','mysql-1','mysql','active','DB demo1',18.5,52.3,2),
  inst('ms-01','mssql-1','sqlserver','active','azure_sqlserver',9.3,42.1,1),
  inst('mg-01','mongodb-1','mongodb','active','EXEM Mongo',14.2,48.9,0),
  inst('rd-01','redis-1','redis','active','DB demo4',3.1,22.8,0),
  inst('tb-01','tibero-1','tibero','active','altibase',31.2,63.5,6),
  // warning
  inst('pg-03','postgresql-3','postgresql','warning','DB demo4',75.3,78.1,14),
  inst('my-04','mysql-4','mysql','warning','DB demo2',78.2,82.1,18),
  inst('or-02','oracle-2','oracle','warning','DB demo2',71.6,76.4,11),
  inst('ms-02','mssql-2','sqlserver','warning','azure_sqlserver',73.7,79.3,13),
  inst('mg-02','mongodb-2','mongodb','warning','EXEM Mongo',69.3,74.1,9),
  inst('tb-02','tibero-2','tibero','warning','altibase',76.3,80.8,14),
  // critical
  inst('pg-cr1','postgres_1','postgresql','critical','DB demo3',94.2,92.1,28,{hostIp:'10.10.48.55'}),
  inst('pg-cr2','postgres_2','postgresql','critical','DB demo2',88.7,85.3,15),
  inst('my-cr1','mysql-cr1','mysql','critical','DB demo1',91.3,88.6,22),
  inst('my-cr2','mysql-cr2','mysql','critical','DB demo2',85.9,79.4,18),
  inst('or-cr1','oracle-cr1','oracle','critical','DB demo3',96.1,94.7,31),
  inst('or-cr2','oracle-cr2','oracle','critical','DB demo4',87.4,83.2,19),
  inst('ms-cr1','mssql-cr1','sqlserver','critical','azure_sqlserver',92.8,90.5,24),
  inst('mg-cr1','mongodb-cr1','mongodb','critical','EXEM Mongo',89.3,86.1,17),
  inst('tb-cr1','tibero-cr1','tibero','critical','altibase',93.5,91.2,26),
]

// ═══════════════════════════════════════════════════════════════
// SCENARIO 3: 슬로우쿼리 발생
// ═══════════════════════════════════════════════════════════════
const slowqueryInstances: DbInstance[] = [
  inst('pg-01','postgresql-1','postgresql','active','DB demo3',62.1,71.4,18),
  inst('pg-02','postgresql-2','postgresql','active','DB demo3',58.4,68.2,14),
  inst('or-01','oracle-1','oracle','active','DB demo1',69.8,74.5,22),
  inst('or-02','oracle-2','oracle','active','DB demo2',55.6,64.7,11),
  inst('my-01','mysql-1','mysql','active','DB demo1',48.5,62.3,9),
  inst('my-02','mysql-2','mysql','active','DB demo1',71.1,77.8,19),
  inst('ms-01','mssql-1','sqlserver','active','azure_sqlserver',39.3,58.1,7),
  inst('ms-02','mssql-2','sqlserver','active','azure_sqlserver',44.7,61.3,8),
  inst('mg-01','mongodb-1','mongodb','active','EXEM Mongo',31.2,52.9,4),
  inst('tb-01','tibero-1','tibero','active','altibase',61.2,73.5,16),
  inst('pg-03','postgresql-3','postgresql','warning','DB demo4',77.3,81.1,24),
  inst('or-cr1','oracle-cr1','oracle','warning','DB demo3',82.4,85.7,28),
]

const slowQueries_slowquery: ScenarioSlowQuery[] = [
  { threadId: '2041', userHost: 'app_user@10.10.2.5', startTime: '2026-03-31 09:12:04', queryTime: 28.4, lockTime: 3.2, rowsExamined: 4820341, rowsSent: 1, sqlText: 'SELECT * FROM order_history WHERE created_at BETWEEN ? AND ? AND customer_id IN (SELECT id FROM customers WHERE region = ?)' },
  { threadId: '2038', userHost: 'report@10.10.2.8', startTime: '2026-03-31 09:10:21', queryTime: 21.1, lockTime: 0.0, rowsExamined: 2450210, rowsSent: 842, sqlText: 'SELECT p.*, SUM(oi.quantity * oi.price) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.id ORDER BY revenue DESC' },
  { threadId: '2055', userHost: 'batch@10.10.2.10', startTime: '2026-03-31 09:08:33', queryTime: 18.7, lockTime: 5.4, rowsExamined: 1820000, rowsSent: 0, sqlText: 'UPDATE user_stats SET total_orders = (SELECT COUNT(*) FROM orders WHERE user_id = user_stats.user_id) WHERE updated_at < NOW() - INTERVAL 1 DAY' },
  { threadId: '2061', userHost: 'analytics@10.10.2.12', startTime: '2026-03-31 09:05:11', queryTime: 15.3, lockTime: 0.1, rowsExamined: 980000, rowsSent: 320, sqlText: 'SELECT DATE(created_at), COUNT(*), AVG(amount) FROM transactions WHERE status = "completed" GROUP BY DATE(created_at) ORDER BY DATE(created_at) DESC LIMIT 90' },
  { threadId: '2033', userHost: 'dba@10.10.2.3', startTime: '2026-03-31 09:02:44', queryTime: 12.8, lockTime: 0.0, rowsExamined: 650000, rowsSent: 1, sqlText: 'SELECT COUNT(DISTINCT user_id) FROM page_views WHERE session_id IN (SELECT session_id FROM sessions WHERE duration > 1800) AND page_url LIKE "/checkout%"' },
]

// ═══════════════════════════════════════════════════════════════
// SCENARIO 4: 디스크 임박
// ═══════════════════════════════════════════════════════════════
const diskInstances: DbInstance[] = [
  inst('pg-01','postgresql-1','postgresql','active','DB demo3',22.1,55.4,4),
  inst('pg-02','postgresql-2','postgresql','active','DB demo3',18.4,49.2,2),
  inst('or-01','oracle-1','oracle','warning','DB demo1',31.8,64.5,8),
  inst('or-02','oracle-2','oracle','warning','DB demo2',28.6,61.4,6),
  inst('my-01','mysql-1','mysql','active','DB demo1',15.5,52.3,2),
  inst('ms-01','mssql-1','sqlserver','warning','azure_sqlserver',24.3,58.1,5),
  inst('mg-01','mongodb-1','mongodb','active','EXEM Mongo',11.2,44.9,1),
  inst('tb-01','tibero-1','tibero','active','altibase',19.2,57.5,3),
  inst('cb-01','cubrid-1','cubrid','active','DB demo5',8.7,38.2,0),
  inst('pg-03','postgresql-3','postgresql','active','DB demo4',14.3,51.1,2),
]

const tablespaces_disk: TablespaceItem[] = [
  { databaseName: 'PROD_TS', tableName: 'USERS', dataLength: 18240, indexLength: 4820, free: 480 },
  { databaseName: 'PROD_TS', tableName: 'ORDER_HIST', dataLength: 42180, indexLength: 8940, free: 320 },
  { databaseName: 'PROD_TS', tableName: 'AUDIT_LOG', dataLength: 38920, indexLength: 3480, free: 120 },
  { databaseName: 'REPORT_TS', tableName: 'DAILY_STATS', dataLength: 29400, indexLength: 5980, free: 85 },
  { databaseName: 'REPORT_TS', tableName: 'SESSION_LOG', dataLength: 22100, indexLength: 4560, free: 42 },
  { databaseName: 'TEMP_TS', tableName: 'TEMP_WORK', dataLength: 15800, indexLength: 2100, free: 18 },
]

// ── 공통 슬로우쿼리 (정상/Critical 상황) ────────────────────────
const slowQueries_normal: ScenarioSlowQuery[] = [
  { threadId: '1042', userHost: 'app_user@10.10.2.5', startTime: '2026-03-31 08:23:11', queryTime: 3.4, lockTime: 0.1, rowsExamined: 182341, rowsSent: 1, sqlText: 'SELECT * FROM orders WHERE status = ? AND created_at > ?' },
  { threadId: '1038', userHost: 'report@10.10.2.8', startTime: '2026-03-31 08:21:44', queryTime: 2.1, lockTime: 0.0, rowsExamined: 95210, rowsSent: 234, sqlText: 'SELECT product_id, SUM(quantity) FROM order_items GROUP BY product_id ORDER BY SUM(quantity) DESC LIMIT 100' },
  { threadId: '1055', userHost: 'batch@10.10.2.10', startTime: '2026-03-31 08:20:02', queryTime: 1.7, lockTime: 0.4, rowsExamined: 48000, rowsSent: 0, sqlText: 'UPDATE users SET last_login = NOW() WHERE id IN (SELECT user_id FROM sessions WHERE expired = 0)' },
]

// ── 알람 이벤트 ─────────────────────────────────────────────────
const alerts_normal: AlertEvent[] = [
  { id: 'e1', ruleName: 'Memory 경고', instanceName: 'postgresql-w1', metric: 'Memory Usage (%)', value: 74.1, threshold: 70, severity: 'warning', status: 'resolved', firedAt: '2026-03-31 07:14:02', resolvedAt: '2026-03-31 07:42:18' },
  { id: 'e2', ruleName: 'CPU 경고', instanceName: 'mysql-w1', metric: 'CPU Usage (%)', value: 72.4, threshold: 70, severity: 'warning', status: 'resolved', firedAt: '2026-03-31 06:50:33', resolvedAt: '2026-03-31 07:10:09' },
]

const alerts_critical: AlertEvent[] = [
  { id: 'e1', ruleName: 'CPU 임계치 초과', instanceName: 'oracle-cr1', metric: 'CPU Usage (%)', value: 96.1, threshold: 85, severity: 'critical', status: 'firing', firedAt: '2026-03-31 09:08:11' },
  { id: 'e2', ruleName: 'CPU 임계치 초과', instanceName: 'postgres_1', metric: 'CPU Usage (%)', value: 94.2, threshold: 85, severity: 'critical', status: 'firing', firedAt: '2026-03-31 09:06:44' },
  { id: 'e3', ruleName: '세션 과부하', instanceName: 'oracle-cr1', metric: 'Active Sessions', value: 31, threshold: 25, severity: 'critical', status: 'firing', firedAt: '2026-03-31 09:05:21' },
  { id: 'e4', ruleName: 'Memory 임계치 초과', instanceName: 'tibero-cr1', metric: 'Memory Usage (%)', value: 91.2, threshold: 85, severity: 'critical', status: 'acknowledged', firedAt: '2026-03-31 08:52:03' },
  { id: 'e5', ruleName: 'CPU 임계치 초과', instanceName: 'mssql-cr1', metric: 'CPU Usage (%)', value: 92.8, threshold: 85, severity: 'critical', status: 'firing', firedAt: '2026-03-31 08:48:19' },
  { id: 'e6', ruleName: 'CPU 경고', instanceName: 'postgresql-3', metric: 'CPU Usage (%)', value: 75.3, threshold: 70, severity: 'warning', status: 'firing', firedAt: '2026-03-31 08:31:05' },
]

const alerts_slowquery: AlertEvent[] = [
  { id: 'e1', ruleName: '슬로우쿼리 임계 초과', instanceName: 'oracle-cr1', metric: 'Slow Query (>10s)', value: 28.4, threshold: 10, severity: 'warning', status: 'firing', firedAt: '2026-03-31 09:12:04' },
  { id: 'e2', ruleName: '슬로우쿼리 감지', instanceName: 'mysql-2', metric: 'Slow Query (>5s)', value: 21.1, threshold: 5, severity: 'warning', status: 'firing', firedAt: '2026-03-31 09:10:21' },
  { id: 'e3', ruleName: 'Lock 세션 초과', instanceName: 'postgresql-3', metric: 'Lock Sessions', value: 8, threshold: 5, severity: 'warning', status: 'acknowledged', firedAt: '2026-03-31 09:08:33' },
]

const alerts_disk: AlertEvent[] = [
  { id: 'e1', ruleName: '디스크 사용률 임박', instanceName: 'oracle-1', metric: 'Tablespace (TEMP_TS)', value: 98.9, threshold: 90, severity: 'critical', status: 'firing', firedAt: '2026-03-31 08:44:11' },
  { id: 'e2', ruleName: '디스크 사용률 경고', instanceName: 'oracle-2', metric: 'Tablespace (REPORT_TS)', value: 95.2, threshold: 90, severity: 'critical', status: 'firing', firedAt: '2026-03-31 08:20:33' },
  { id: 'e3', ruleName: '디스크 사용률 경고', instanceName: 'mssql-1', metric: 'Tablespace (PROD_TS)', value: 91.7, threshold: 90, severity: 'warning', status: 'firing', firedAt: '2026-03-31 07:58:02' },
]

// ── 빈 슬로우쿼리 (disk 시나리오) ───────────────────────────────
const tablespaces_normal: TablespaceItem[] = [
  { databaseName: 'production', tableName: 'order_items', dataLength: 2840, indexLength: 1240, free: 4320 },
  { databaseName: 'production', tableName: 'audit_log', dataLength: 1920, indexLength: 480, free: 3840 },
  { databaseName: 'production', tableName: 'users', dataLength: 890, indexLength: 340, free: 5200 },
  { databaseName: 'analytics', tableName: 'events', dataLength: 4200, indexLength: 980, free: 3120 },
  { databaseName: 'analytics', tableName: 'sessions', dataLength: 2100, indexLength: 560, free: 2450 },
]

// ═══════════════════════════════════════════════════════════════
// 시나리오 피처 설명 (Guide 패널용)
// ═══════════════════════════════════════════════════════════════
const features_normal: ScenarioFeature[] = [
  { id: 'summary', label: '상태 요약 카드', area: 'summary-bar', description: '전체 인스턴스의 상태를 Active / Warning / Critical / No Signal 4가지로 분류해서 한눈에 보여줍니다.', tip: '숫자를 클릭하면 해당 상태의 인스턴스만 필터링됩니다.' },
  { id: 'hexgrid', label: '헥사곤 그리드', area: 'hexagon-grid', description: '각 DB 인스턴스를 헥사곤(육각형) 아이콘으로 시각화합니다. 색상으로 상태를 직관적으로 파악할 수 있습니다.', tip: '정상 상태에서는 파란색(Active) 헥사곤이 대부분을 차지합니다.' },
  { id: 'table', label: '인스턴스 목록 테이블', area: 'instance-table', description: 'CPU / Memory / 세션 수치를 테이블로 확인합니다. 컬럼 정렬로 이상 인스턴스를 빠르게 찾을 수 있습니다.', tip: 'CPU 컬럼 클릭 시 내림차순 정렬이 가능합니다.' },
  { id: 'filter', label: 'DB 타입 / 그룹 필터', area: 'filter-panel', description: 'PostgreSQL, Oracle, MySQL 등 DB 타입별로 필터링하거나 운영 그룹(demo1, azure 등)별로 분류할 수 있습니다.', tip: '멀티 선택이 가능하여 여러 타입을 동시에 조회할 수 있습니다.' },
]

const features_critical: ScenarioFeature[] = [
  { id: 'critical-badge', label: 'Critical 상태 인스턴스', area: 'summary-bar', description: '9개 인스턴스가 Critical 상태입니다. CPU 85% 이상 / 세션 과부하 등 임계치 초과 시 자동으로 상태가 변경됩니다.', tip: 'Critical 카드 클릭 시 해당 인스턴스만 즉시 필터링됩니다.' },
  { id: 'alert-list', label: '발화 중인 알람', area: 'alert-panel', description: '현재 5건의 알람이 firing 상태입니다. 알람은 등록된 규칙(임계치 조건)에 따라 자동 발생합니다.', tip: 'Acknowledged 처리로 담당자가 인지했음을 팀에 공유할 수 있습니다.' },
  { id: 'hexgrid-red', label: '헥사곤 Critical 표시', area: 'hexagon-grid', description: '빨간 헥사곤은 즉각적인 조치가 필요한 인스턴스입니다. 클릭 시 상세 메트릭을 확인할 수 있습니다.', tip: '정상 → Critical 전환 시 알람 규칙에 따라 Email/Slack 알림이 발송됩니다.' },
  { id: 'perf-analysis', label: '성능분석으로 원인 파악', area: 'performance', description: '성능분석 페이지에서 해당 인스턴스의 CPU 급등 원인을 TPS/세션/IOPS 추이 그래프로 분석합니다.', tip: '시간 범위를 "10분"으로 좁히면 장애 발생 시점을 정밀하게 확인할 수 있습니다.' },
]

const features_slowquery: ScenarioFeature[] = [
  { id: 'slow-list', label: 'Slow Query 목록', area: 'slow-query', description: '실행 시간이 임계치(기본 5초)를 초과한 쿼리를 실시간으로 수집합니다. Query Time, Rows Examined으로 무거운 쿼리를 식별합니다.', tip: '쿼리 텍스트 클릭 시 전체 SQL과 실행 계획 힌트를 확인할 수 있습니다.' },
  { id: 'top-sql', label: 'Top SQL 분석', area: 'top-sql', description: '실행 횟수 / 대기시간 기준으로 상위 SQL을 랭킹합니다. 빈번하게 실행되는 무거운 쿼리가 시스템 부하의 주요 원인입니다.', tip: 'Wait Time이 높은 SQL은 인덱스 최적화 또는 쿼리 튜닝 대상입니다.' },
  { id: 'lock-session', label: 'Lock 세션 모니터링', area: 'session-dist', description: '슬로우쿼리가 발생하면 Lock 세션이 증가하는 패턴이 나타납니다. 세션 분포에서 Lock 비율을 확인합니다.', tip: 'Lock Session이 연속 증가하면 해당 쿼리의 트랜잭션 처리 방식을 검토해야 합니다.' },
  { id: 'scatter', label: 'Response Time Scatter', area: 'scatter-chart', description: '개별 쿼리의 응답시간을 산점도로 시각화합니다. 정상 구간에서 이탈한 이상치(outlier)를 시각적으로 확인합니다.', tip: '성능분석 > 분석 탭에서 Scatter 차트를 통해 이상 쿼리를 확인하세요.' },
]

const features_disk: ScenarioFeature[] = [
  { id: 'tablespace', label: 'Tablespace 사용률', area: 'tablespace', description: 'DB 내 테이블스페이스 사용량을 모니터링합니다. 여유 공간(Free)이 부족한 경우 확장 또는 아카이빙이 필요합니다.', tip: 'TEMP_TS의 잔여 공간이 18MB로 임박 상태입니다. 즉시 조치가 필요합니다.' },
  { id: 'disk-alert', label: '디스크 임박 알람 규칙', area: 'alert-rule', description: 'Tablespace 사용률 90% 초과 시 알람이 발생하도록 사전에 규칙을 설정합니다. 임계치는 사용자 지정이 가능합니다.', tip: '90% / 95% 두 단계로 Warning → Critical 이중 알람 규칙을 설정하는 것을 권장합니다.' },
  { id: 'warning-instance', label: 'Warning 인스턴스 확인', area: 'summary-bar', description: '디스크 임박으로 인해 oracle-1, oracle-2, mssql-1이 Warning 상태입니다. 확장 전 영향 인스턴스를 먼저 파악합니다.', tip: '인스턴스 상세에서 Tablespace 탭을 통해 테이블별 상세 사용량을 확인할 수 있습니다.' },
]

// ═══════════════════════════════════════════════════════════════
// SCENARIOS EXPORT
// ═══════════════════════════════════════════════════════════════
export const SCENARIOS: Record<ScenarioKey, Scenario> = {
  normal: {
    key: 'normal',
    label: '정상 운영',
    emoji: '🟢',
    badge: { bg: '#d1fae5', color: '#059669' },
    description: '모든 DB 인스턴스가 정상 범위에서 운영 중인 상태입니다. 기본 모니터링 기능과 화면 구성을 살펴봅니다.',
    instances: normalInstances,
    metrics: { cpuAvg: 14, memAvg: 44, totalSessions: 52, activeSessions: 48, tps: 342, connectionUsage: 38 },
    slowQueries: slowQueries_normal,
    tablespaces: tablespaces_normal,
    alerts: alerts_normal,
    highlightMessage: '전체 30개 인스턴스 중 28개 Active, 2개 Warning 상태로 안정적으로 운영 중입니다.',
    features: features_normal,
  },
  critical: {
    key: 'critical',
    label: 'Critical 장애',
    emoji: '🔴',
    badge: { bg: '#fee2e2', color: '#dc2626' },
    description: '복수의 DB 인스턴스가 Critical 상태에 진입한 장애 상황입니다. 알람 발생부터 원인 분석 흐름을 확인합니다.',
    instances: criticalInstances,
    metrics: { cpuAvg: 71, memAvg: 78, totalSessions: 204, activeSessions: 178, tps: 89, connectionUsage: 88 },
    slowQueries: slowQueries_normal,
    tablespaces: tablespaces_normal,
    alerts: alerts_critical,
    highlightMessage: '9개 인스턴스가 Critical 상태입니다. CPU 85%+ / 세션 과부하로 알람 5건이 발화 중입니다.',
    features: features_critical,
  },
  slowquery: {
    key: 'slowquery',
    label: '슬로우쿼리 발생',
    emoji: '🐢',
    badge: { bg: '#fef3c7', color: '#b45309' },
    description: '무거운 쿼리로 인해 DB 응답 시간이 급증한 상황입니다. Slow Query 탐지 및 Top SQL 분석 기능을 확인합니다.',
    instances: slowqueryInstances,
    metrics: { cpuAvg: 62, memAvg: 71, totalSessions: 141, activeSessions: 118, tps: 134, connectionUsage: 71 },
    slowQueries: slowQueries_slowquery,
    tablespaces: tablespaces_normal,
    alerts: alerts_slowquery,
    highlightMessage: '슬로우쿼리 최대 28.4초 감지. Lock 세션 8건 증가 중이며 TPS가 평소의 39% 수준으로 저하됐습니다.',
    features: features_slowquery,
  },
  disk: {
    key: 'disk',
    label: '디스크 임박',
    emoji: '💾',
    badge: { bg: '#ede9fe', color: '#7c3aed' },
    description: '일부 DB의 테이블스페이스 사용량이 임계치에 근접한 상황입니다. 디스크 모니터링 및 알람 규칙 설정을 확인합니다.',
    instances: diskInstances,
    metrics: { cpuAvg: 21, memAvg: 55, totalSessions: 33, activeSessions: 31, tps: 287, connectionUsage: 42 },
    slowQueries: [],
    tablespaces: tablespaces_disk,
    alerts: alerts_disk,
    highlightMessage: 'TEMP_TS 잔여 18MB(99% 사용). REPORT_TS 잔여 42MB(95% 사용). 즉시 확장 또는 아카이빙이 필요합니다.',
    features: features_disk,
  },
}
