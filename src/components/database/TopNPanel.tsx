'use client'
import type { TopSqlItem, TopEventItem } from '@/types/db.types'

interface TopSqlPanelProps { items: TopSqlItem[] }
interface TopEventPanelProps { items: TopEventItem[] }

export function TopSqlPanel({ items }: TopSqlPanelProps) {
  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>Top SQL for 10min</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
            {['#', 'SQL Text', 'Exec Count', 'Wait Time'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(row => (
            <tr key={row.rank} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1E3050')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <td style={{ padding: '6px 8px', color: 'var(--color-active)', fontWeight: 700, width: 24 }}>{row.rank}</td>
              <td style={{ padding: '6px 8px', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{row.sqlText}</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-primary)' }}>{row.execCount.toLocaleString()}</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--color-warning)' }}>{row.waitTime.toLocaleString()}ms</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TopEventPanel({ items }: TopEventPanelProps) {
  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>Top Event for 10min</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
            {['#', 'Event Name', 'Exec Count', 'Errors', 'Warnings'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(row => (
            <tr key={row.rank} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1E3050')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <td style={{ padding: '6px 8px', color: 'var(--color-active)', fontWeight: 700, width: 24 }}>{row.rank}</td>
              <td style={{ padding: '6px 8px', color: 'var(--text-primary)' }}>{row.eventName}</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-primary)' }}>{row.execCount.toLocaleString()}</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', color: row.errors > 0 ? 'var(--color-critical)' : 'var(--text-muted)' }}>{row.errors}</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', color: row.warnings > 0 ? 'var(--color-warning)' : 'var(--text-muted)' }}>{row.warnings}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
