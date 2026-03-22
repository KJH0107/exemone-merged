import type { DbMetric, SessionDistribution, TopSqlItem, TopEventItem, SlowQueryItem, TablespaceItem, ReplicationStatus, TimeSeriesPoint } from '@/types/db.types'

export const mockMetric: DbMetric = {
  cpuUsage: 47,
  memoryUsed: 6420,
  memoryTotal: 16384,
  activeSessions: 23,
  totalSessions: 148,
  lockSessions: 2,
  longSessions: 5,
  idleSessions: 118,
  tps: 342,
  connectionUsage: 74,
  connections: 148,
  maxConnections: 200,
}

export const mockSessionDist: SessionDistribution = {
  active: 23,
  idle: 118,
  lock: 2,
  long: 5,
}

export const mockTopSql: TopSqlItem[] = [
  { rank: 1, sqlText: 'SELECT * FROM orders WHERE status = ? AND created_at > ?', digest: 'a1b2c3d4', execCount: 4821, waitTime: 12340 },
  { rank: 2, sqlText: 'UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?', digest: 'e5f6g7h8', execCount: 2341, waitTime: 8920 },
  { rank: 3, sqlText: 'SELECT u.*, p.* FROM users u JOIN profiles p ON u.id = p.user_id WHERE u.active = true', digest: 'i9j0k1l2', execCount: 1892, waitTime: 6780 },
  { rank: 4, sqlText: 'INSERT INTO audit_log (user_id, action, timestamp) VALUES (?, ?, NOW())', digest: 'm3n4o5p6', execCount: 1560, waitTime: 4320 },
  { rank: 5, sqlText: 'SELECT COUNT(*) FROM sessions WHERE last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)', digest: 'q7r8s9t0', execCount: 980, waitTime: 2100 },
]

export const mockTopEvent: TopEventItem[] = [
  { rank: 1, eventName: 'wait/io/table/sql/handler', execCount: 28420, errors: 0, warnings: 12 },
  { rank: 2, eventName: 'wait/lock/table/sql/handler', execCount: 4821, errors: 2, warnings: 34 },
  { rank: 3, eventName: 'wait/io/file/innodb/innodb_log_file', execCount: 3210, errors: 0, warnings: 5 },
  { rank: 4, eventName: 'wait/synch/mutex/innodb/buf_pool_mutex', execCount: 2890, errors: 0, warnings: 0 },
  { rank: 5, eventName: 'wait/io/socket/sql/client_connection', execCount: 1420, errors: 8, warnings: 21 },
]

export const mockSlowQuery: SlowQueryItem[] = [
  { threadId: '1042', userHost: 'app_user@10.10.2.5', startTime: '2026-03-10 14:23:11', queryTime: 12.4, lockTime: 0.2, rowsExamined: 892341, rowsSent: 1, sqlText: 'SELECT * FROM log_history WHERE created_at BETWEEN ? AND ? AND level = ?' },
  { threadId: '1038', userHost: 'report@10.10.2.8', startTime: '2026-03-10 14:21:44', queryTime: 8.1, lockTime: 0.0, rowsExamined: 450210, rowsSent: 234, sqlText: 'SELECT product_id, SUM(quantity) FROM order_items GROUP BY product_id ORDER BY SUM(quantity) DESC LIMIT 100' },
  { threadId: '1055', userHost: 'batch@10.10.2.10', startTime: '2026-03-10 14:20:02', queryTime: 6.7, lockTime: 1.4, rowsExamined: 320000, rowsSent: 0, sqlText: 'UPDATE users SET last_login = NOW() WHERE id IN (SELECT user_id FROM sessions WHERE expired = 0)' },
]

export const mockTablespace: TablespaceItem[] = [
  { databaseName: 'production', tableName: 'order_items', dataLength: 2840, indexLength: 1240, free: 320 },
  { databaseName: 'production', tableName: 'audit_log', dataLength: 1920, indexLength: 480, free: 840 },
  { databaseName: 'production', tableName: 'users', dataLength: 890, indexLength: 340, free: 1200 },
  { databaseName: 'analytics', tableName: 'events', dataLength: 4200, indexLength: 980, free: 120 },
  { databaseName: 'analytics', tableName: 'sessions', dataLength: 2100, indexLength: 560, free: 450 },
]

export const mockReplication: ReplicationStatus = {
  ioRunning: true,
  sqlRunning: true,
  secondsBehind: 3,
}

function genTimeSeries(base: number, count = 30, variance = 10): TimeSeriesPoint[] {
  const now = Date.now()
  return Array.from({ length: count }, (_, i) => ({
    timestamp: now - (count - i) * 5000,
    value: Math.max(0, base + (Math.random() - 0.5) * variance * 2),
  }))
}

export const mockCpuSeries = genTimeSeries(47, 30, 12)
export const mockMemSeries = genTimeSeries(6420, 30, 200)
export const mockTpsSeries = genTimeSeries(342, 30, 80)
export const mockSessionSeries = genTimeSeries(148, 30, 15)
