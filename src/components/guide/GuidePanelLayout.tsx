'use client'
import { usePathname } from 'next/navigation'
import { useGuideStore } from '@/stores/guideStore'
import { PAGE_FEATURES, type PageKey } from '@/lib/guide/features'
import type { PageFeatures, FeatureItem } from '@/lib/guide/features'

// 패널 너비 — 발표용 가독성을 위해 360px
export const GUIDE_PANEL_WIDTH = 360

// pathname → PageKey 매핑
function getPageKey(pathname: string): PageKey | null {
  if (pathname.startsWith('/home'))        return 'home'
  if (pathname.startsWith('/database'))    return 'database'
  if (pathname.startsWith('/performance')) return 'performance'
  if (pathname.startsWith('/alert'))       return 'alert'
  return null
}

// 컨텍스트별 색상 테마
type Theme = 'blue' | 'teal'
function getTheme(pageKey: PageKey | null): Theme {
  return pageKey === 'database-detail' ? 'teal' : 'blue'
}

const THEMES = {
  blue: {
    headerBg: '#eff6ff',
    headerBorder: '#bfdbfe',
    accent: '#2563eb',
    accentLight: '#dbeafe',
    accentText: '#1e40af',
    badge: { bg: '#dbeafe', color: '#1e40af' },
    step: '#2563eb',
    tip: { bg: '#f0f9ff', border: '#bae6fd', left: '#0ea5e9', label: '#0369a1', text: '#0c4a6e' },
    back: '#2563eb',
  },
  teal: {
    headerBg: '#f0fdfa',
    headerBorder: '#99f6e4',
    accent: '#0d9488',
    accentLight: '#ccfbf1',
    accentText: '#134e4a',
    badge: { bg: '#ccfbf1', color: '#0f766e' },
    step: '#0d9488',
    tip: { bg: '#f0fdfa', border: '#99f6e4', left: '#14b8a6', label: '#0f766e', text: '#134e4a' },
    back: '#0d9488',
  },
}

export default function GuidePanelLayout() {
  const pathname = usePathname()
  const { isOpen, activeFeature, isDrawerOpen, close, setFeature } = useGuideStore()

  const pageKey = isDrawerOpen ? 'database-detail' : getPageKey(pathname)
  const pageFeatures = pageKey ? PAGE_FEATURES[pageKey] : null
  const theme = getTheme(pageKey)

  return (
    <>
      {/* 기능 선택 시 어두운 오버레이 */}
      {isOpen && activeFeature && (
        <div
          onClick={() => setFeature(null)}
          style={{
            position: 'fixed', inset: 0,
            right: GUIDE_PANEL_WIDTH,
            zIndex: 10,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(1px)',
            cursor: 'pointer',
          }}
        />
      )}

      {/* 가이드 패널 */}
      <div style={{
        width: isOpen ? GUIDE_PANEL_WIDTH : 0,
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width .22s cubic-bezier(.4,0,.2,1)',
        position: 'relative',
      }}>
        <div style={{
          width: GUIDE_PANEL_WIDTH,
          height: '100%',
          background: '#fff',
          borderLeft: '1px solid #e3e7ea',
          boxShadow: '-4px 0 24px rgba(0,0,0,.1)',
          display: 'flex', flexDirection: 'column',
          position: 'absolute', top: 0, right: 0, bottom: 0,
        }}>

          {pageFeatures ? (
            activeFeature ? (
              <DetailView
                feature={pageFeatures.features.find(f => f.id === activeFeature)!}
                pageFeatures={pageFeatures}
                theme={theme}
                onBack={() => setFeature(null)}
                onSelect={setFeature}
                onClose={close}
              />
            ) : (
              <ListView
                pageFeatures={pageFeatures}
                theme={theme}
                onSelect={setFeature}
                onClose={close}
              />
            )
          ) : (
            <NoGuide onClose={close} />
          )}

        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// 컨텍스트 배지 — 드로어 진입 시 상단에 표시
// ═══════════════════════════════════════════════════════════════
function ContextBreadcrumb({ pageFeatures, theme }: { pageFeatures: PageFeatures; theme: Theme }) {
  if (pageFeatures.key !== 'database-detail') return null
  const t = THEMES[theme]
  return (
    <div style={{
      padding: '7px 16px',
      background: t.accentLight,
      borderBottom: `1px solid ${t.headerBorder}`,
      display: 'flex', alignItems: 'center', gap: 6,
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 12, color: '#64748b' }}>🗄 오버뷰</span>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>›</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: t.accentText }}>🖥 인스턴스 상세</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 목록 뷰
// ═══════════════════════════════════════════════════════════════
function ListView({ pageFeatures, theme, onSelect, onClose }: {
  pageFeatures: PageFeatures
  theme: Theme
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const t = THEMES[theme]
  return (
    <>
      <ContextBreadcrumb pageFeatures={pageFeatures} theme={theme} />

      {/* 헤더 */}
      <div style={{
        padding: '18px 20px 16px',
        borderBottom: `1px solid ${t.headerBorder}`,
        background: t.headerBg,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{pageFeatures.icon}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', letterSpacing: -0.3 }}>
              {pageFeatures.label}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: t.badge.bg, color: t.badge.color,
              padding: '3px 10px', borderRadius: 99, letterSpacing: 0.2,
            }}>기능 가이드</span>
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.8, margin: 0, wordBreak: 'keep-all' }}>
          {pageFeatures.description}
        </p>
      </div>

      {/* 기능 목록 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 14px' }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#94a3b8',
          letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase',
        }}>
          기능 목록 — 클릭하면 화면에서 위치 확인
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pageFeatures.features.map(f => (
            <FeatureListItem key={f.id} feature={f} accent={t.accent} onClick={() => onSelect(f.id)} />
          ))}
        </div>
      </div>

      {/* 하단 안내 */}
      <div style={{
        padding: '12px 20px',
        borderTop: `1px solid ${t.headerBorder}`,
        background: t.headerBg,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7, wordBreak: 'keep-all' }}>
          기능을 클릭하면 화면에서 해당 영역이 강조됩니다
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// 상세 뷰
// ═══════════════════════════════════════════════════════════════
function DetailView({ feature, pageFeatures, theme, onBack, onSelect, onClose }: {
  feature: FeatureItem
  pageFeatures: PageFeatures
  theme: Theme
  onBack: () => void
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const t = THEMES[theme]
  const idx = pageFeatures.features.findIndex(f => f.id === feature.id)
  const prev = idx > 0 ? pageFeatures.features[idx - 1] : null
  const next = idx < pageFeatures.features.length - 1 ? pageFeatures.features[idx + 1] : null

  return (
    <>
      <ContextBreadcrumb pageFeatures={pageFeatures} theme={theme} />

      {/* 헤더 */}
      <div style={{
        padding: '14px 18px 16px',
        borderBottom: `1px solid ${t.headerBorder}`,
        background: t.headerBg,
        flexShrink: 0,
      }}>
        {/* 네비게이션 바 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: t.back, fontWeight: 700,
            padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            ← 목록으로
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              {idx + 1} / {pageFeatures.features.length}
            </span>
            <button onClick={onClose} style={closeBtn}>✕</button>
          </div>
        </div>

        {/* 기능 아이콘 + 이름 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 44, height: 44, borderRadius: 12,
            background: t.accentLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            {feature.icon}
          </span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: t.accentText, letterSpacing: -0.3, lineHeight: 1.3 }}>
              {feature.label}
            </div>
            <div style={{ fontSize: 13, color: t.accent, marginTop: 3, lineHeight: 1.5, wordBreak: 'keep-all' }}>
              {feature.summary}
            </div>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 18px' }}>

        {/* 기능 설명 */}
        <div style={{ marginBottom: 22 }}>
          <SectionLabel>기능 설명</SectionLabel>
          <p style={{
            fontSize: 14, color: '#1e293b', lineHeight: 1.95,
            margin: 0, wordBreak: 'keep-all',
          }}>
            {feature.description}
          </p>
        </div>

        {/* 사용 순서 */}
        {feature.steps && feature.steps.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <SectionLabel>사용 순서</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {feature.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: t.step, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, marginTop: 1,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 14, color: '#334155', lineHeight: 1.75, wordBreak: 'keep-all' }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 사용 팁 */}
        {feature.tip && (
          <div style={{
            background: t.tip.bg,
            border: `1px solid ${t.tip.border}`,
            borderLeft: `4px solid ${t.tip.left}`,
            borderRadius: '0 10px 10px 0',
            padding: '14px 16px',
            marginBottom: feature.relatedFeatures?.length ? 22 : 0,
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: t.tip.label, marginBottom: 6 }}>
              💡 사용 팁
            </div>
            <div style={{ fontSize: 14, color: t.tip.text, lineHeight: 1.85, wordBreak: 'keep-all' }}>
              {feature.tip}
            </div>
          </div>
        )}

        {/* 연관 기능 — 흐름을 이어가는 하이퍼링크 */}
        {feature.relatedFeatures && feature.relatedFeatures.length > 0 && (
          <div>
            <SectionLabel>이어서 확인하세요</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {feature.relatedFeatures.map(rel => (
                <button
                  key={rel.id}
                  onClick={() => onSelect(rel.id)}
                  style={{
                    width: '100%', textAlign: 'left', cursor: 'pointer',
                    padding: '10px 14px', borderRadius: 9,
                    border: `1.5px solid ${t.headerBorder}`,
                    background: t.headerBg,
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    transition: 'all .15s',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = t.accent
                    el.style.background = t.accentLight
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = t.headerBorder
                    el.style.background = t.headerBg
                  }}
                >
                  <span style={{ fontSize: 16, color: t.accent, flexShrink: 0, marginTop: 1 }}>→</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.accentText, marginBottom: 2 }}>
                      {rel.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, wordBreak: 'keep-all' }}>
                      {rel.reason}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: t.accent, flexShrink: 0, marginTop: 3 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 이전 / 다음 네비게이션 */}
      <div style={{
        padding: '12px 14px',
        borderTop: `1px solid ${t.headerBorder}`,
        background: t.headerBg,
        display: 'flex', gap: 8, flexShrink: 0,
      }}>
        <NavBtn feature={prev} direction="prev" accent={t.accent} onClick={prev ? () => onSelect(prev.id) : undefined} />
        <NavBtn feature={next} direction="next" accent={t.accent} onClick={next ? () => onSelect(next.id) : undefined} />
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// 서브 컴포넌트
// ═══════════════════════════════════════════════════════════════
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, color: '#94a3b8',
      letterSpacing: 1.2, marginBottom: 10, textTransform: 'uppercase',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <span style={{ display: 'inline-block', width: 3, height: 12, background: '#cbd5e1', borderRadius: 2 }} />
      {children}
    </div>
  )
}

function NoGuide({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 28, position: 'relative',
    }}>
      <button onClick={onClose} style={{ ...closeBtn, position: 'absolute', top: 14, right: 16 }}>✕</button>
      <div style={{ fontSize: 40, marginBottom: 14 }}>📖</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 8, textAlign: 'center' }}>
        이 페이지는 가이드가 없습니다
      </div>
      <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 1.8, wordBreak: 'keep-all' }}>
        홈, 오버뷰, 성능분석, 알람<br />페이지로 이동하면 기능 가이드를 볼 수 있습니다
      </div>
    </div>
  )
}

function FeatureListItem({ feature, accent, onClick }: {
  feature: FeatureItem
  accent: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        padding: '12px 14px', borderRadius: 10,
        border: '1.5px solid #e2e8f0', background: '#fff',
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'all .15s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = accent
        el.style.background = '#f8fafc'
        el.style.transform = 'translateX(2px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = '#e2e8f0'
        el.style.background = '#fff'
        el.style.transform = 'translateX(0)'
      }}
    >
      <span style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: '#f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>
        {feature.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 3 }}>
          {feature.label}
        </div>
        <div style={{
          fontSize: 12, color: '#64748b',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          wordBreak: 'keep-all',
        }}>
          {feature.summary}
        </div>
      </div>
      <span style={{ fontSize: 18, color: '#cbd5e1', flexShrink: 0 }}>›</span>
    </button>
  )
}

function NavBtn({ feature, direction, accent, onClick }: {
  feature: FeatureItem | null
  direction: 'prev' | 'next'
  accent: string
  onClick?: () => void
}) {
  if (!feature) return <div style={{ flex: 1 }} />
  const isPrev = direction === 'prev'
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
        border: `1.5px solid ${accent}22`,
        background: `${accent}08`,
        display: 'flex', alignItems: 'center', gap: 8,
        flexDirection: isPrev ? 'row' : 'row-reverse',
        transition: 'all .15s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = `${accent}18`
        el.style.borderColor = `${accent}55`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = `${accent}08`
        el.style.borderColor = `${accent}22`
      }}
    >
      <span style={{ fontSize: 16, color: accent, flexShrink: 0 }}>
        {isPrev ? '←' : '→'}
      </span>
      <div style={{ flex: 1, minWidth: 0, textAlign: isPrev ? 'left' : 'right' }}>
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>
          {isPrev ? '이전' : '다음'}
        </div>
        <div style={{
          fontSize: 12, fontWeight: 700, color: '#374151',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {feature.label}
        </div>
      </div>
    </button>
  )
}

const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 16, color: '#94a3b8', padding: '4px 6px', borderRadius: 6,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  lineHeight: 1,
}
