'use client'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  color?: string
  alert?: boolean
  sub?: string
}

export default function MetricCard({ label, value, unit = '', color = 'var(--text-primary)', alert = false, sub }: MetricCardProps) {
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: `1px solid ${alert ? 'var(--color-critical)' : 'var(--border)'}`,
      borderRadius: 8,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      boxShadow: alert ? '0 0 10px rgba(255,31,63,0.2)' : 'none',
    }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
      <span style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1.1 }}>
        {value}<span style={{ fontSize: 14, fontWeight: 400, marginLeft: 2 }}>{unit}</span>
      </span>
      {sub && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  )
}
