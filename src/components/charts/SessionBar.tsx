'use client'
import type { SessionDistribution } from '@/types/db.types'

interface SessionBarProps {
  dist: SessionDistribution
}

const STATUS_COLORS = {
  active: '#006DFF',
  idle:   '#9BD9FF',
  lock:   '#FF1F3F',
  long:   '#FFEF23',
}

export default function SessionBar({ dist }: SessionBarProps) {
  const total = dist.active + dist.idle + dist.lock + dist.long || 1
  const segments = [
    { key: 'active', label: 'Active', value: dist.active, color: STATUS_COLORS.active },
    { key: 'idle',   label: 'Idle',   value: dist.idle,   color: STATUS_COLORS.idle },
    { key: 'lock',   label: 'Lock',   value: dist.lock,   color: STATUS_COLORS.lock },
    { key: 'long',   label: 'Long',   value: dist.long,   color: STATUS_COLORS.long },
  ] as const

  return (
    <div>
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', gap: 1 }}>
        {segments.map(s => (
          <div key={s.key} style={{
            width: `${(s.value / total) * 100}%`,
            background: s.color,
            minWidth: s.value > 0 ? 2 : 0,
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
        {segments.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 600 }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
