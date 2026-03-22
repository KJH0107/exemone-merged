import type { DbInstance, DbType, InstanceStatus } from '@/types/db.types'

const GROUPS = ['DB demo1','DB demo2','DB demo3','DB demo4','DB demo5','altibase','azure','azure_sqlserver','EXEM Mongo']

function inst(id: string, name: string, dbType: DbType, status: InstanceStatus, group: string, cpu: number, mem: number, sessions: number, extra?: Partial<DbInstance>): DbInstance {
  return {
    id, name, alias: extra?.alias ?? '', clusterNode: extra?.clusterNode ?? '',
    version: extra?.version ?? '', dbType, group, status,
    cpuUsage: cpu, memoryUsage: mem, activeSessionCount: sessions,
    monitoring: status !== 'nosignal',
    deployType: extra?.deployType ?? 'Single',
    hostIp: extra?.hostIp ?? `10.10.${Math.floor(Math.random()*5)+1}.${Math.floor(Math.random()*200)+10}`,
  }
}

export const mockInstances: DbInstance[] = [
  // Active (28)
  inst('pg-01','postgresql-1','postgresql','active','DB demo3',37.9,69.4,0,{version:'14',hostIp:'10.10.48.55'}),
  inst('pg-02','postgresql-2','postgresql','active','DB demo3',12.1,45.2,3),
  inst('pg-03','postgresql-3','postgresql','active','DB demo4',55.3,72.1,8),
  inst('pg-04','postgresql-4','postgresql','active','DB demo4',8.2,38.9,1),
  inst('pg-05','postgresql-5','postgresql','active','DB demo5',29.4,61.0,5),
  inst('my-01','mysql-1','mysql','active','DB demo1',18.5,52.3,2),
  inst('my-02','mysql-2','mysql','active','DB demo1',43.1,67.8,7),
  inst('my-03','mysql-3','mysql','active','DB demo2',6.4,31.2,0),
  inst('my-04','mysql-4','mysql','active','DB demo2',71.2,80.1,12),
  inst('or-01','oracle-1','oracle','active','DB demo1',22.8,58.4,4),
  inst('or-02','oracle-2','oracle','active','DB demo2',15.6,44.7,2),
  inst('or-03','oracle-3','oracle','active','DB demo3',38.9,66.2,6),
  inst('ms-01','mssql-1','sqlserver','active','azure_sqlserver',9.3,42.1,1),
  inst('ms-02','mssql-2','sqlserver','active','azure_sqlserver',31.7,59.3,3),
  inst('ms-03','mssql-3','sqlserver','active','azure',19.8,51.6,2),
  inst('mg-01','mongodb-1','mongodb','active','EXEM Mongo',14.2,48.9,0),
  inst('mg-02','mongodb-2','mongodb','active','EXEM Mongo',27.5,62.4,4),
  inst('mg-03','mongodb-3','mongodb','active','EXEM Mongo',8.9,35.7,1),
  inst('rd-01','redis-1','redis','active','DB demo4',3.1,22.8,0),
  inst('rd-02','redis-2','redis','active','DB demo4',5.4,28.3,0),
  inst('rd-03','redis-3','redis','active','DB demo5',2.8,19.4,0),
  inst('tb-01','tibero-1','tibero','active','altibase',41.2,73.5,9),
  inst('tb-02','tibero-2','tibero','active','altibase',16.3,47.8,2),
  inst('cb-01','cubrid-1','cubrid','active','DB demo5',11.7,40.2,1),
  inst('pg-06','postgresql-6','postgresql','active','DB demo1',33.8,64.1,5),
  inst('my-05','mysql-5','mysql','active','DB demo3',48.6,71.3,8),
  inst('or-04','oracle-4','oracle','active','DB demo4',25.1,55.9,3),
  inst('ms-04','mssql-4','sqlserver','active','azure',7.6,36.4,0),

  // Critical (12)
  inst('pg-cr1','postgres_1','postgresql','critical','DB demo3',94.2,92.1,28,{version:'14',hostIp:'10.10.48.55'}),
  inst('pg-cr2','postgres_2','postgresql','critical','DB demo2',88.7,85.3,15),
  inst('my-cr1','mysql-cr1','mysql','critical','DB demo1',91.3,88.6,22),
  inst('my-cr2','mysql-cr2','mysql','critical','DB demo2',85.9,79.4,18),
  inst('or-cr1','oracle-cr1','oracle','critical','DB demo3',96.1,94.7,31),
  inst('or-cr2','oracle-cr2','oracle','critical','DB demo4',87.4,83.2,19),
  inst('ms-cr1','mssql-cr1','sqlserver','critical','azure_sqlserver',92.8,90.5,24),
  inst('mg-cr1','mongodb-cr1','mongodb','critical','EXEM Mongo',89.3,86.1,17),
  inst('tb-cr1','tibero-cr1','tibero','critical','altibase',93.5,91.2,26),
  inst('pg-cr3','postgres_3','postgresql','critical','DB demo5',86.7,82.4,14),
  inst('my-cr3','mysql-cr3','mysql','critical','DB demo1',90.1,87.8,20),
  inst('or-cr3','oracle-cr3','oracle','critical','DB demo2',88.2,84.6,16),
]

export const DB_TYPES = ['All','PostgreSQL','MongoDB','Oracle','Tibero','Cubrid','Redis','Altibase','MySQL','SQL Server']

export const summarize = (instances: DbInstance[]) => ({
  total:    instances.length,
  active:   instances.filter(i => i.status === 'active').length,
  warning:  instances.filter(i => i.status === 'warning').length,
  critical: instances.filter(i => i.status === 'critical').length,
  nosignal: instances.filter(i => i.status === 'nosignal').length,
})
