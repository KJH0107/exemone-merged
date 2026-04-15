'use client'
import type { PageFeatures, FeatureItem } from '@/lib/guide/features'

interface Props {
  pageFeatures: PageFeatures
  activeFeature: string | null
  onFeatureClick: (id: string | null) => void
}

export default function FeaturePanel({ pageFeatures, activeFeature, onFeatureClick }: Props) {
  const active = pageFeatures.features.find(f => f.id === activeFeature) ?? null

  return (
    <div style={{
      width: 320, flexShrink: 0,
      background: '#fff', borderLeft: '1px solid #e3e7ea',
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      zIndex: 30,  // 오버레이(10)보다 위
      position: 'relative',
    }}>
      {active ? (
        <DetailView feature={active} pageFeatures={pageFeatures} onBack={() => onFeatureClick(null)} onSelect={onFeatureClick} />
      ) : (
        <ListView pageFeatures={pageFeatures} onSelect={onFeatureClick} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 목록 뷰 (기능 선택 전)
// ═══════════════════════════════════════════════════════════════
function ListView({ pageFeatures, onSelect }: {
  pageFeatures: PageFeatures
  onSelect: (id: string) => void
}) {
  return (
    <>
      {/* 헤더 */}
      <div style={{
        padding: '16px 18px 14px',
        borderBottom: '1px solid #e3e7ea',
        background: '#f8fafc',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>{pageFeatures.icon}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#282c32' }}>{pageFeatures.label}</span>
          <span style={{
            marginLeft: 'auto', fontSize: 10, fontWeight: 700,
            background: '#dbeafe', color: '#1d4ed8',
            padding: '2px 8px', borderRadius: 99,
          }}>
            기능 가이드
          </span>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
          {pageFeatures.description}
        </p>
      </div>

      {/* 기능 목록 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' }}>
          기능 목록 — 클릭하면 화면에서 위치를 확인합니다
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {pageFeatures.features.map(f => (
            <FeatureListItem key={f.id} feature={f} onClick={() => onSelect(f.id)} />
          ))}
        </div>
      </div>

      {/* 하단 안내 */}
      <div style={{
        padding: '12px 18px', borderTop: '1px solid #e3e7ea',
        background: '#f8fafc', textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
          기능을 클릭하면<br />화면에서 해당 영역이 강조됩니다
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// 상세 뷰 (기능 선택 후) — 패널 전체 사용
// ═══════════════════════════════════════════════════════════════
function DetailView({ feature, pageFeatures, onBack, onSelect }: {
  feature: FeatureItem
  pageFeatures: PageFeatures
  onBack: () => void
  onSelect: (id: string) => void
}) {
  const currentIdx = pageFeatures.features.findIndex(f => f.id === feature.id)
  const prev = currentIdx > 0 ? pageFeatures.features[currentIdx - 1] : null
  const next = currentIdx < pageFeatures.features.length - 1 ? pageFeatures.features[currentIdx + 1] : null

  return (
    <>
      {/* 상단: 뒤로가기 + 현재 기능명 */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e3e7ea',
        background: '#eff6ff',
        flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: '#3b82f6', fontWeight: 600,
            padding: '0 0 8px', marginBottom: 2,
          }}
        >
          ← 목록으로 돌아가기
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#dbeafe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>
            {feature.icon}
          </span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e3a8a' }}>{feature.label}</div>
            <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 1 }}>{feature.summary}</div>
          </div>
        </div>
      </div>

      {/* 본문 설명 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '18px' }}>

        {/* 설명 */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' }}>
            기능 설명
          </div>
          <p style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.8, margin: 0 }}>
            {feature.description}
          </p>
        </div>

        {/* 사용 순서 */}
        {feature.steps && feature.steps.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.6, marginBottom: 10, textTransform: 'uppercase' }}>
              사용 순서
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {feature.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: '#3b82f6', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, marginTop: 1,
                  }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 팁 */}
        {feature.tip && (
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderLeft: '4px solid #38bdf8',
            borderRadius: '0 8px 8px 0',
            padding: '12px 14px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>💡 사용 팁</div>
            <div style={{ fontSize: 13, color: '#0c4a6e', lineHeight: 1.7 }}>{feature.tip}</div>
          </div>
        )}
      </div>

      {/* 하단: 이전/다음 기능 네비게이션 */}
      <div style={{
        padding: '12px 14px', borderTop: '1px solid #e3e7ea',
        display: 'flex', gap: 8, flexShrink: 0,
        background: '#f8fafc',
      }}>
        <NavBtn
          feature={prev}
          direction="prev"
          onClick={prev ? () => onSelect(prev.id) : undefined}
        />
        <NavBtn
          feature={next}
          direction="next"
          onClick={next ? () => onSelect(next.id) : undefined}
        />
      </div>
    </>
  )
}

// ── 기능 목록 아이템 ────────────────────────────────────────────
function FeatureListItem({ feature, onClick }: { feature: FeatureItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        padding: '10px 12px', borderRadius: 8,
        border: '1.5px solid #e2e8f0',
        background: '#fff',
        transition: 'all .15s',
        display: 'flex', alignItems: 'center', gap: 10,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#93c5fd'
        ;(e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'
        ;(e.currentTarget as HTMLButtonElement).style.background = '#fff'
      }}
    >
      <span style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: '#f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16,
      }}>
        {feature.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#282c32', marginBottom: 2 }}>
          {feature.label}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {feature.summary}
        </div>
      </div>
      <span style={{ fontSize: 16, color: '#cbd5e1', flexShrink: 0 }}>›</span>
    </button>
  )
}

// ── 이전/다음 네비게이션 버튼 ───────────────────────────────────
function NavBtn({ feature, direction, onClick }: {
  feature: FeatureItem | null
  direction: 'prev' | 'next'
  onClick?: () => void
}) {
  if (!feature) return <div style={{ flex: 1 }} />
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
        border: '1px solid #e2e8f0', background: '#fff',
        display: 'flex', alignItems: 'center',
        gap: 6, textAlign: direction === 'next' ? 'right' : 'left',
        flexDirection: direction === 'next' ? 'row-reverse' : 'row',
        transition: 'all .15s',
      }}
    >
      <span style={{ fontSize: 14, color: '#94a3b8' }}>
        {direction === 'prev' ? '←' : '→'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 1 }}>
          {direction === 'prev' ? '이전' : '다음'}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {feature.label}
        </div>
      </div>
    </button>
  )
}
