'use client'
import type { InstanceStatus } from '@/types/db.types'

interface Summary { total: number; active: number; warning: number; critical: number; nosignal: number }

interface SummaryBarProps {
  summary: Summary
  selected: InstanceStatus | 'total' | null
  onSelect: (s: InstanceStatus | 'total' | null) => void
}

const CARDS = [
  { key: 'total',    label: '전체 인스턴스 수',              color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'active',   label: '활성 인스턴스 수',              color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
  { key: 'warning',  label: '경고 인스턴스 수',              color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  { key: 'critical', label: '장애 인스턴스 수',              color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  { key: 'nosignal', label: '점검/모니터링 제외 인스턴스 수', color: '#6b7280', bg: '#f9fafb', border: '#d1d5db' },
] as const

export default function SummaryBar({ summary, selected, onSelect }: SummaryBarProps) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      {CARDS.map(card => {
        const count = card.key === 'total'
          ? `${summary.total} / ${summary.total}`
          : summary[card.key as keyof Summary]
        const isSelected = selected === card.key
        return (
          <div key={card.key}
            onClick={() => onSelect(isSelected ? null : card.key as InstanceStatus | 'total')}
            style={{
              flex: 1, background: isSelected ? card.bg : '#fff',
              border: `1px solid ${isSelected ? card.color : 'var(--border)'}`,
              borderRadius: 8, padding: '12px 16px', cursor: 'pointer',
              boxShadow: isSelected ? `0 0 0 2px ${card.border}` : 'var(--card-shadow)',
              transition: 'all .15s',
              outline: isSelected ? `2px solid ${card.color}` : 'none',
            }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, whiteSpace: 'nowrap' }}>
              {card.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: card.color, lineHeight: 1 }}>
              {count}
            </div>
          </div>
        )
      })}
    </div>
  )
}
