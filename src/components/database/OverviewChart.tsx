'use client'

import { useState, useCallback, useMemo } from 'react'
import type { DbInstance } from '@/types/db.types'

// ─── 메트릭 설정 ──────────────────────────────────────────────────────────────
const METRIC_COLORS = {
  type0: '#4B9EFF',  // CPU    — 파란색
  type1: '#3DD68C',  // Memory — 초록색
  type2: '#FFB547',  // Active — 주황색
  type3: '#CF7AFF',  // TPS    — 보라색
}

const METRIC_LABELS_DEFAULT = ['CPU', 'Memory', 'Active', 'TPS']

// 결정론적 TPS 생성 (id 기반, 새로고침마다 안 바뀜)
function seedTps(id: string): number {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return Math.floor((hash % 480) + 20)
}

// ─── 바 너비 계산 ──────────────────────────────────────────────────────────────
function barWidth(value: number, max: number, isPercent = false): number {
  if (isPercent) {
    const w = Math.min(100, Math.max(0, value))
    return w < 0.5 && w > 0 ? 0.5 : w
  }
  if (!max || !value) return 0
  const ratio = (value / max) * 100
  return Math.min(100, Math.max(0, ratio < 0.5 && ratio > 0 ? 0.5 : ratio))
}

// ─── 값 포맷팅 ─────────────────────────────────────────────────────────────────
function fmt(value: number, unit: 'percent' | 'count'): string {
  if (value == null || isNaN(value)) return '-'
  if (unit === 'percent') return `${value.toFixed(1)}%`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return `${Math.round(value)}`
}

// ─── 알림 클래스 ───────────────────────────────────────────────────────────────
function alertBg(status: DbInstance['status']): string {
  if (status === 'critical') return 'rgba(239,68,68,0.15)'
  if (status === 'warning')  return 'rgba(245,158,11,0.15)'
  return 'transparent'
}

// ─── 타입 ─────────────────────────────────────────────────────────────────────
export interface OverviewChartProps {
  instances: DbInstance[]
  selectedId?: string
  onSelect?: (id: string) => void
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function OverviewChart({ instances, selectedId, onSelect }: OverviewChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [labels, setLabels] = useState(METRIC_LABELS_DEFAULT)
  const [metricPopup, setMetricPopup] = useState<{ type: 'type2' | 'type3'; x: number; y: number } | null>(null)

  // 우측 메트릭 최대값 (막대 비율 계산용)
  const maxActive = useMemo(
    () => Math.max(...instances.map(i => i.activeSessionCount), 1),
    [instances],
  )
  const maxTps = useMemo(
    () => Math.max(...instances.map(i => seedTps(i.id)), 1),
    [instances],
  )

  const handleBadgeClick = useCallback(
    (type: 'type2' | 'type3', e: React.MouseEvent) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      setMetricPopup(prev =>
        prev?.type === type ? null : { type, x: rect.left, y: rect.bottom + 4 },
      )
    },
    [],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', fontSize: 11 }}>

      {/* ── 배지 헤더 ── */}
      <div style={{
        height: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 8px', flexShrink: 0, borderBottom: '1px solid var(--border-light)',
      }}>
        {/* 좌측: CPU / Memory (고정) */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['type0', 'type1'] as const).map((t, i) => (
            <Badge key={t} color={METRIC_COLORS[t]} label={labels[i]} />
          ))}
        </div>
        {/* 우측: Active / TPS (변경 가능) */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['type2', 'type3'] as const).map((t, i) => (
            <Badge
              key={t}
              color={METRIC_COLORS[t]}
              label={labels[i + 2]}
              editable
              onClick={e => handleBadgeClick(t, e)}
            />
          ))}
        </div>
      </div>

      {/* ── 인스턴스 목록 ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {instances.map(inst => {
          const cpu     = inst.cpuUsage
          const mem     = inst.memoryUsage
          const active  = inst.activeSessionCount
          const tps     = seedTps(inst.id)

          const isSelected = inst.id === selectedId
          const isHovered  = inst.id === hoveredId
          const isDownplay = hoveredId !== null && !isSelected && !isHovered

          let rowBg = alertBg(inst.status)
          if (isSelected) rowBg = 'rgba(59,130,246,0.18)'
          else if (isHovered) rowBg = 'rgba(59,130,246,0.08)'

          return (
            <div
              key={inst.id}
              onClick={() => onSelect?.(inst.id)}
              onMouseEnter={() => setHoveredId(inst.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: 38,
                cursor: 'pointer',
                background: rowBg,
                opacity: isDownplay ? 0.45 : 1,
                transition: 'background 0.12s, opacity 0.12s',
                borderBottom: '1px solid var(--border-light)',
              }}
            >
              {/* 좌측 막대 (CPU ↑, Memory ↓) — 오른쪽→왼쪽으로 자람 */}
              <div style={{ width: '29%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3, alignItems: 'flex-end', paddingLeft: 12 }}>
                <Bar value={barWidth(cpu, 100, true)} color={METRIC_COLORS.type0} dir="left" />
                <Bar value={barWidth(mem, 100, true)} color={METRIC_COLORS.type1} dir="left" />
              </div>

              {/* 좌측 값 */}
              <div style={{
                width: '14%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
                gap: 1, paddingRight: 6, textAlign: 'right',
                borderLeft: '1px solid rgba(102,102,102,0.4)',
              }}>
                <span style={{ color: METRIC_COLORS.type0, lineHeight: 1.4 }}>{fmt(cpu, 'percent')}</span>
                <span style={{ color: METRIC_COLORS.type1, lineHeight: 1.4 }}>{fmt(mem, 'percent')}</span>
              </div>

              {/* 인스턴스명 */}
              <div style={{
                width: '14%', textAlign: 'center', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontSize: 12, fontWeight: isSelected ? 600 : 400,
                color: 'var(--text-primary)', padding: '0 4px',
              }}>
                {inst.name}
              </div>

              {/* 우측 값 */}
              <div style={{
                width: '14%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
                gap: 1, paddingLeft: 6,
                borderRight: '1px solid rgba(102,102,102,0.4)',
              }}>
                <span style={{ color: METRIC_COLORS.type2, lineHeight: 1.4 }}>{fmt(active, 'count')}</span>
                <span style={{ color: METRIC_COLORS.type3, lineHeight: 1.4 }}>{fmt(tps, 'count')}</span>
              </div>

              {/* 우측 막대 (Active ↑, TPS ↓) — 왼쪽→오른쪽으로 자람 */}
              <div style={{ width: '29%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3, alignItems: 'flex-start', paddingRight: 12 }}>
                <Bar value={barWidth(active, maxActive)} color={METRIC_COLORS.type2} dir="right" />
                <Bar value={barWidth(tps, maxTps)} color={METRIC_COLORS.type3} dir="right" />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── 메트릭 변경 팝업 ── */}
      {metricPopup && (
        <MetricPopup
          type={metricPopup.type}
          x={metricPopup.x}
          y={metricPopup.y}
          current={labels[metricPopup.type === 'type2' ? 2 : 3]}
          onSelect={name => {
            setLabels(prev => {
              const next = [...prev]
              next[metricPopup.type === 'type2' ? 2 : 3] = name
              return next
            })
            setMetricPopup(null)
          }}
          onClose={() => setMetricPopup(null)}
        />
      )}
    </div>
  )
}

// ─── 서브 컴포넌트: 배지 ───────────────────────────────────────────────────────
function Badge({
  color, label, editable, onClick,
}: {
  color: string
  label: string
  editable?: boolean
  onClick?: (e: React.MouseEvent) => void
}) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        height: 20, padding: '0 6px',
        border: `1px solid ${color}`,
        borderRadius: 2,
        color,
        fontSize: 11,
        cursor: editable ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {label}
      {editable && <span style={{ fontSize: 9, opacity: 0.7 }}>▾</span>}
    </span>
  )
}

// ─── 서브 컴포넌트: 막대 ───────────────────────────────────────────────────────
function Bar({ value, color, dir }: { value: number; color: string; dir: 'left' | 'right' }) {
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: dir === 'left' ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          height: 6,
          width: `${value}%`,
          background: color,
          borderRadius: dir === 'left' ? '4px 0 0 4px' : '0 4px 4px 0',
          transition: 'width 0.3s ease',
          minWidth: value > 0 ? 2 : 0,
        }}
      />
    </div>
  )
}

// ─── 서브 컴포넌트: 메트릭 변경 팝업 ─────────────────────────────────────────
const METRIC_OPTIONS_TYPE2 = ['Active', 'Wait', 'Lock', 'Idle']
const METRIC_OPTIONS_TYPE3 = ['TPS', 'QPS', 'Slow Query', 'Deadlock']

function MetricPopup({
  type, x, y, current, onSelect, onClose,
}: {
  type: 'type2' | 'type3'
  x: number
  y: number
  current: string
  onSelect: (name: string) => void
  onClose: () => void
}) {
  const options = type === 'type2' ? METRIC_OPTIONS_TYPE2 : METRIC_OPTIONS_TYPE3

  return (
    <>
      {/* backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
      <div style={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 100,
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        width: 140,
        overflow: 'hidden',
        fontSize: 11,
      }}>
        {options.map(opt => (
          <div
            key={opt}
            onClick={() => onSelect(opt)}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              fontWeight: opt === current ? 600 : 400,
              background: opt === current ? 'var(--grid-selected-bg)' : 'transparent',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--grid-hover-bg)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = opt === current ? 'var(--grid-selected-bg)' : 'transparent' }}
          >
            {opt}
          </div>
        ))}
      </div>
    </>
  )
}
