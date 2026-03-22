'use client'
import type { DbInstance, InstanceStatus } from '@/types/db.types'

const STATUS_LABEL: Record<InstanceStatus, { label: string; bg: string; color: string }> = {
  active:   { label: 'Active',    bg: '#d1fae5', color: '#059669' },
  warning:  { label: 'Warning',   bg: '#fef3c7', color: '#d97706' },
  critical: { label: 'Critical',  bg: '#fee2e2', color: '#dc2626' },
  nosignal: { label: 'No Signal', bg: '#f3f4f6', color: '#6b7280' },
}

const DB_TYPE_LABEL: Record<string, string> = {
  postgresql: 'PostgreSQL', mysql: 'MySQL', oracle: 'Oracle',
  sqlserver: 'SQL Server', mongodb: 'MongoDB', redis: 'Redis',
  tibero: 'Tibero', cubrid: 'Cubrid',
}

interface InstanceTableProps {
  instances: DbInstance[]
  onSelect: (inst: DbInstance) => void
  selectedId?: string
}

export default function InstanceTable({ instances, onSelect, selectedId }: InstanceTableProps) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>인스턴스 목록</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>총 {instances.length}개</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--grid-header-bg)', borderBottom: '1px solid var(--border)' }}>
              {['Instance Name','Alias','Cluster Node','Version','Status','Alert','CPU Usage (%)','Memory Usage (%)','Active Session Count','Monitoring','DB종류','배포유형'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', borderRight: '1px solid var(--border-light)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {instances.map(inst => {
              const s = STATUS_LABEL[inst.status]
              const isSelected = inst.id === selectedId
              return (
                <tr key={inst.id}
                  onClick={() => onSelect(inst)}
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    background: isSelected ? 'var(--grid-selected-bg)' : 'transparent',
                    cursor: 'pointer', transition: 'background .1s',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--grid-hover-bg)' }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                >
                  <td style={{ padding: '8px 12px', color: 'var(--color-blue)', fontWeight: 500 }}>{inst.name}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{inst.alias || '-'}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{inst.clusterNode || 'empty'}</td>
                  <td style={{ padding: '8px 12px' }}>{inst.version || '-'}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 11 }}>{s.label}</span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    {inst.status === 'critical' && <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Critical</span>}
                    {inst.status === 'warning' && <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Warning</span>}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <UsageBar value={inst.cpuUsage} critical={inst.cpuUsage > 80} warning={inst.cpuUsage > 60} />
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <UsageBar value={inst.memoryUsage} critical={inst.memoryUsage > 85} warning={inst.memoryUsage > 70} />
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{inst.activeSessionCount}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ color: inst.monitoring ? 'var(--color-normal)' : 'var(--text-muted)', fontSize: 11 }}>
                      {inst.monitoring ? '●' : '○'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                      {DB_TYPE_LABEL[inst.dbType] || inst.dbType}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{inst.deployType}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function UsageBar({ value, critical, warning }: { value: number; critical: boolean; warning: boolean }) {
  const color = critical ? '#ef4444' : warning ? '#f59e0b' : '#3b82f6'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 60, height: 6, background: '#e3e7ea', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, color: critical ? '#ef4444' : 'var(--text-secondary)', fontWeight: critical ? 600 : 400 }}>
        {value.toFixed(1)}
      </span>
    </div>
  )
}
