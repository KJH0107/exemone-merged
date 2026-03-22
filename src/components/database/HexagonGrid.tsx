'use client'
import { useState } from 'react'
import type { DbInstance, InstanceStatus } from '@/types/db.types'

const STATUS_COLOR: Record<InstanceStatus, string> = {
  active:   '#10b981',
  warning:  '#f59e0b',
  critical: '#ef4444',
  nosignal: '#9fa5ae',
}

// Honeycomb dimensions (pointy-top hexagon — 12시/6시 꼭짓점)
// s = 35 → W = s*√3 ≈ 61, H = 2*s = 70
const S = 35
const GAP = 4                      // 헥사곤 사이 간격
const W = Math.round(S * 1.732)   // 61px  — cell width
const H = S * 2                    // 70px  — cell height
const COL_STEP = W + GAP           // 65px — horizontal center-to-center
const ROW_STEP = Math.round(H * 0.75) + GAP  // 57px — vertical center-to-center
const ROW_H_OFFSET = Math.round(COL_STEP * 0.5)  // 33px — odd rows shift right
const COLS = 16

interface HexagonGridProps {
  instances: DbInstance[]
  onSelect: (inst: DbInstance) => void
}

interface TooltipState { inst: DbInstance; x: number; y: number }

export default function HexagonGrid({ instances, onSelect }: HexagonGridProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [groupBy, setGroupBy] = useState('해당없음')

  const numRows = Math.ceil(instances.length / COLS)
  const actualCols = numRows > 1 ? COLS : instances.length
  const containerW = actualCols * COL_STEP + (numRows > 1 ? ROW_H_OFFSET : 0) + 4
  const containerH = numRows * ROW_STEP + Math.round(H * 0.25) + 4

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>인스턴스 탭</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>그룹화</span>
            <select value={groupBy} onChange={e => setGroupBy(e.target.value)} style={{
              border: '1px solid var(--border)', borderRadius: 4, padding: '3px 8px',
              fontSize: 12, background: '#fff', color: 'var(--text-primary)',
            }}>
              <option>해당없음</option>
              <option>DB demo1</option><option>DB demo2</option><option>DB demo3</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>심각순으로 보기</span>
            <div style={{ width: 32, height: 18, borderRadius: 9, background: '#e3e7ea', cursor: 'pointer' }} />
          </div>
        </div>
      </div>

      {/* Honeycomb grid — absolute positioning, centered */}
      <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div style={{ position: 'relative', width: containerW, height: containerH }}>
          {instances.map((inst, idx) => {
            const row = Math.floor(idx / COLS)
            const col = idx % COLS
            const x = col * COL_STEP + (row % 2 === 1 ? ROW_H_OFFSET : 0)
            const y = row * ROW_STEP

            return (
              <div
                key={inst.id}
                style={{ position: 'absolute', left: x, top: y, width: W, height: H }}
                onClick={() => onSelect(inst)}
                onMouseEnter={e => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setTooltip({ inst, x: rect.left, y: rect.bottom + 6 })
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                <HexCell inst={inst} />
              </div>
            )
          })}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: 'fixed', left: tooltip.x, top: tooltip.y,
            background: '#fff', border: '1px solid var(--border)', borderRadius: 8,
            padding: '10px 14px', zIndex: 1000,
            boxShadow: '0 4px 16px rgba(0,0,0,.12)', minWidth: 210,
            pointerEvents: 'none',
          }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{tooltip.inst.name}</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <StatusBadge status={tooltip.inst.status} />
            </div>
            <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <InfoRow label="Host IP"             value={tooltip.inst.hostIp} />
              {tooltip.inst.version && <InfoRow label="Version" value={tooltip.inst.version} />}
              <InfoRow label="CPU Usage (%)"       value={`${tooltip.inst.cpuUsage.toFixed(1)}%`} />
              <InfoRow label="Memory Usage (%)"    value={`${tooltip.inst.memoryUsage.toFixed(1)}%`} />
              <InfoRow label="Active Session Count" value={String(tooltip.inst.activeSessionCount)} />
              <InfoRow label="Status"              value={tooltip.inst.status.charAt(0).toUpperCase() + tooltip.inst.status.slice(1)} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function HexCell({ inst }: { inst: DbInstance }) {
  const color = STATUS_COLOR[inst.status]
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', height: '100%',
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        background: hovered ? `${color}cc` : color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'background .15s',
      }}
    >
      <DbIcon type={inst.dbType} />
    </div>
  )
}

// ── DB 아이콘: 각 DBMS를 흰색으로 명확하게 표현 ──────────────────
function DbIcon({ type }: { type: string }) {
  const style: React.CSSProperties = { fill: 'none', stroke: '#fff', strokeWidth: 1.8, overflow: 'visible' }

  const icons: Record<string, JSX.Element> = {
    postgresql: (
      <svg width="30" height="30" viewBox="0 0 24 24" style={style}>
        {/* Elephant head simplified */}
        <ellipse cx="12" cy="9" rx="7" ry="7" strokeWidth="1.8"/>
        <path d="M5 9 Q3 14 5 18" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="10" cy="8" r="1.2" fill="#fff" stroke="none"/>
        <circle cx="14" cy="8" r="1.2" fill="#fff" stroke="none"/>
        <path d="M9 12 Q12 14.5 15 12" strokeLinecap="round"/>
      </svg>
    ),
    mysql: (
      <svg width="30" height="30" viewBox="0 0 24 24" style={style}>
        {/* Dolphin */}
        <path d="M4 14 Q8 6 14 8 Q18 9 19 13 Q20 17 16 18 Q12 19 10 16" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 18 Q19 20 21 18" strokeLinecap="round"/>
        <circle cx="10" cy="10" r="1" fill="#fff" stroke="none"/>
      </svg>
    ),
    oracle: (
      <svg width="30" height="30" viewBox="0 0 24 24" style={style}>
        {/* Stacked cylinders */}
        <ellipse cx="12" cy="6" rx="8" ry="2.5"/>
        <line x1="4" y1="6" x2="4" y2="12"/>
        <line x1="20" y1="6" x2="20" y2="12"/>
        <ellipse cx="12" cy="12" rx="8" ry="2.5"/>
        <line x1="4" y1="12" x2="4" y2="18"/>
        <line x1="20" y1="12" x2="20" y2="18"/>
        <ellipse cx="12" cy="18" rx="8" ry="2.5"/>
      </svg>
    ),
    sqlserver: (
      <svg width="30" height="30" viewBox="0 0 24 24" style={{ fill: '#fff', stroke: 'none' }}>
        <rect x="4" y="4" width="7" height="7" rx="1"/>
        <rect x="13" y="4" width="7" height="7" rx="1"/>
        <rect x="4" y="13" width="7" height="7" rx="1"/>
        <rect x="13" y="13" width="7" height="7" rx="1"/>
      </svg>
    ),
    mongodb: (
      <svg width="30" height="30" viewBox="0 0 24 24" style={style}>
        {/* Leaf */}
        <path d="M12 3 Q20 8 18 16 Q16 20 12 21 Q8 20 6 16 Q4 8 12 3Z" strokeLinejoin="round"/>
        <line x1="12" y1="21" x2="12" y2="14" strokeWidth="1.8"/>
      </svg>
    ),
    redis: (
      <svg width="30" height="30" viewBox="0 0 24 24" style={style}>
        {/* Stacked layers */}
        <ellipse cx="12" cy="7" rx="8" ry="2.5"/>
        <ellipse cx="12" cy="12" rx="8" ry="2.5"/>
        <ellipse cx="12" cy="17" rx="8" ry="2.5"/>
        <line x1="4" y1="7" x2="4" y2="17"/>
        <line x1="20" y1="7" x2="20" y2="17"/>
      </svg>
    ),
    tibero: (
      <svg width="30" height="30" viewBox="0 0 24 24" style={{ fill: 'none', stroke: '#fff', strokeWidth: 2.2, strokeLinecap: 'round' }}>
        <line x1="12" y1="4" x2="12" y2="20"/>
        <line x1="4" y1="4" x2="20" y2="4"/>
      </svg>
    ),
    cubrid: (
      <svg width="30" height="30" viewBox="0 0 24 24" style={style}>
        <rect x="4" y="5" width="16" height="4" rx="2"/>
        <rect x="4" y="10" width="16" height="4" rx="2"/>
        <rect x="4" y="15" width="16" height="4" rx="2"/>
      </svg>
    ),
  }

  return icons[type] ?? (
    <svg width="30" height="30" viewBox="0 0 24 24" style={style}>
      <circle cx="12" cy="12" r="8"/>
    </svg>
  )
}

function StatusBadge({ status }: { status: InstanceStatus }) {
  const map: Record<InstanceStatus, { bg: string; color: string; label: string }> = {
    active:   { bg: '#d1fae5', color: '#059669', label: 'Active' },
    warning:  { bg: '#fef3c7', color: '#d97706', label: 'Warning' },
    critical: { bg: '#fee2e2', color: '#dc2626', label: 'Alert' },
    nosignal: { bg: '#f3f4f6', color: '#6b7280', label: 'No Signal' },
  }
  const s = map[status]
  return (
    <span style={{ fontSize: 11, background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
      {s.label}
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <span style={{ color: 'var(--text-muted)', minWidth: 150 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}
