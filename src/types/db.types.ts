export type DbType = 'postgresql' | 'mysql' | 'oracle' | 'sqlserver' | 'mongodb' | 'redis' | 'tibero' | 'cubrid'
export type InstanceStatus = 'active' | 'warning' | 'critical' | 'nosignal'

export interface DbInstance {
  id: string
  name: string
  alias: string
  clusterNode: string
  version: string
  dbType: DbType
  group: string
  status: InstanceStatus
  cpuUsage: number
  memoryUsage: number
  activeSessionCount: number
  monitoring: boolean
  deployType: 'Single' | 'Cluster' | 'Replication'
  hostIp: string
}

export interface TimeSeriesPoint {
  timestamp: number
  value: number
}

export interface DbMetric {
  cpuUsage: number
  memoryUsed: number
  memoryTotal: number
  activeSessions: number
  totalSessions: number
  lockSessions: number
  longSessions: number
  idleSessions: number
  tps: number
  connectionUsage: number
  connections: number
  maxConnections: number
}

export interface SessionDistribution {
  active: number
  idle: number
  lock: number
  long: number
}

export interface TopSqlItem {
  rank: number
  sqlText: string
  digest: string
  execCount: number
  waitTime: number
}

export interface TopEventItem {
  rank: number
  eventName: string
  execCount: number
  errors: number
  warnings: number
}

export interface SlowQueryItem {
  threadId: string
  userHost: string
  startTime: string
  queryTime: number
  lockTime: number
  rowsExamined: number
  rowsSent: number
  sqlText: string
}

export interface TablespaceItem {
  databaseName: string
  tableName: string
  dataLength: number
  indexLength: number
  free: number
}

export interface ReplicationStatus {
  ioRunning: boolean
  sqlRunning: boolean
  secondsBehind: number
}
