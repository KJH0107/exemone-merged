'use client'
import React from 'react'
import { usePathname } from 'next/navigation'
import { useGuideStore } from '@/stores/guideStore'
import { PAGE_FEATURES, type PageKey, type FeatureChallenge } from '@/lib/guide/features'
import type { PageFeatures, FeatureItem } from '@/lib/guide/features'

const detailFeatures = PAGE_FEATURES['database-detail']

// 패널 너비 — 발표용 가독성을 위해 360px
export const GUIDE_PANEL_WIDTH = 360

// pathname → PageKey 매핑
function getPageKey(pathname: string): PageKey | null {
  if (pathname.startsWith('/home'))        return 'home'
  if (pathname.startsWith('/database'))    return 'database'
  if (pathname.startsWith('/performance')) return 'performance'
  if (pathname.startsWith('/alert'))       return 'alert'
  // file:// 프로토콜에서 pathname이 파일 경로가 될 때 database 기본값 반환
  if (pathname.includes('.html') || pathname.match(/^\/[A-Z]:/)) return 'database'
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
                onStartDetailFlow={useGuideStore.getState().setPendingDetailFeature}
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

      {/* 오버뷰 → Instance Detail 연결 섹션 */}
      {pageFeatures.key === 'database' && (
        <div style={{
          padding: '14px 14px 10px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: '#94a3b8',
            letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ display: 'inline-block', width: 3, height: 12, background: '#cbd5e1', borderRadius: 2 }} />
            다음 단계 — Instance Detail 가이드
          </div>
          <div style={{
            background: '#f0fdfa',
            border: '1.5px solid #99f6e4',
            borderRadius: 10,
            padding: '10px 14px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>🖥</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#134e4a' }}>인스턴스를 클릭하면 이어집니다</span>
            </div>
            <div style={{ fontSize: 12, color: '#0f766e', lineHeight: 1.7, marginBottom: 10, wordBreak: 'keep-all' }}>
              목록 또는 맵에서 인스턴스를 클릭하면 오른쪽 슬라이드가 열리고, 가이드가 자동으로 Instance Detail 모드로 전환됩니다.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {detailFeatures.features.map(f => (
                <span key={f.id} style={{
                  fontSize: 11, padding: '3px 9px', borderRadius: 99,
                  background: '#ccfbf1', color: '#0f766e', fontWeight: 600,
                }}>
                  {f.icon} {f.label.replace(' 탭 (', ' (').replace(/\).*/, ')')}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 하단 안내 */}
      <div style={{
        padding: '10px 20px',
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
// ═══════════════════════════════════════════════════════════════
// 챌린지 카드
// ═══════════════════════════════════════════════════════════════
function ChallengeCard({ featureId, challenge }: { featureId: string; challenge: FeatureChallenge }) {
  const { completedChallenges, completeChallenge } = useGuideStore()
  const done = completedChallenges.includes(featureId)
  const [quizSelected, setQuizSelected] = React.useState<number | null>(null)
  const quizAnswered = quizSelected !== null
  const quizCorrect = quizSelected === challenge.quiz?.answer

  return (
    <div style={{
      border: done ? '2px solid #10b981' : '2px dashed #f59e0b',
      borderRadius: 12,
      overflow: 'hidden',
      marginTop: 4,
    }}>
      {/* 헤더 */}
      <div style={{
        background: done ? '#ecfdf5' : '#fffbeb',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: done ? '1px solid #a7f3d0' : '1px solid #fde68a',
      }}>
        <span style={{ fontSize: 18 }}>{done ? '✅' : '🎯'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: done ? '#065f46' : '#92400e' }}>
            {done ? '완료!' : '직접 해보세요'}
          </div>
          <div style={{ fontSize: 11, color: done ? '#059669' : '#b45309', marginTop: 1 }}>
            {done ? '이 기능을 직접 체험했습니다' : challenge.prompt}
          </div>
        </div>
      </div>

      {!done && (
        <div style={{ padding: '12px 14px', background: '#fff' }}>
          {/* 행동 지시 */}
          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.75, margin: '0 0 12px', wordBreak: 'keep-all' }}>
            {challenge.action}
          </p>

          {/* 퀴즈 */}
          {challenge.quiz && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                💬 {challenge.quiz.question}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {challenge.quiz.options.map((opt, i) => {
                  const isSelected = quizSelected === i
                  const isCorrect  = i === challenge.quiz!.answer
                  const bg = !quizAnswered
                    ? isSelected ? '#eff6ff' : '#f9fafb'
                    : isCorrect ? '#ecfdf5' : isSelected ? '#fef2f2' : '#f9fafb'
                  const border = !quizAnswered
                    ? isSelected ? '#3b82f6' : '#e5e7eb'
                    : isCorrect ? '#10b981' : isSelected ? '#ef4444' : '#e5e7eb'
                  const color = !quizAnswered ? '#374151'
                    : isCorrect ? '#065f46' : isSelected ? '#991b1b' : '#9ca3af'

                  return (
                    <button
                      key={i}
                      disabled={quizAnswered}
                      onClick={() => setQuizSelected(i)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 12px',
                        borderRadius: 7, border: `1.5px solid ${border}`,
                        background: bg, color, fontSize: 12,
                        cursor: quizAnswered ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'all .12s',
                        fontWeight: quizAnswered && isCorrect ? 700 : 400,
                      }}
                    >
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        background: border, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700,
                      }}>
                        {quizAnswered ? (isCorrect ? '✓' : isSelected ? '✗' : String.fromCharCode(65 + i)) : String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  )
                })}
              </div>
              {quizAnswered && (
                <div style={{
                  marginTop: 8, padding: '8px 12px', borderRadius: 7,
                  background: quizCorrect ? '#ecfdf5' : '#fef2f2',
                  fontSize: 12, color: quizCorrect ? '#065f46' : '#991b1b',
                  fontWeight: 600, lineHeight: 1.5,
                }}>
                  {quizCorrect ? '✅ 정답입니다!' : `❌ 정답은 "${challenge.quiz!.options[challenge.quiz!.answer]}"입니다.`}
                </div>
              )}
            </div>
          )}

          {/* 수동 완료 버튼 */}
          <button
            onClick={() => completeChallenge(featureId)}
            style={{
              width: '100%', padding: '9px', borderRadius: 8,
              background: '#f59e0b', border: 'none', color: '#fff',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              transition: 'background .15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#d97706' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f59e0b' }}
          >
            해봤어요! ✓
          </button>
        </div>
      )}

      {done && (
        <div style={{ padding: '10px 14px', background: '#ecfdf5', fontSize: 13, color: '#065f46', lineHeight: 1.75, wordBreak: 'keep-all' }}>
          {challenge.success}
        </div>
      )}
    </div>
  )
}

function DetailView({ feature, pageFeatures, theme, onBack, onSelect, onClose, onStartDetailFlow }: {
  feature: FeatureItem
  pageFeatures: PageFeatures
  theme: Theme
  onBack: () => void
  onSelect: (id: string) => void
  onClose: () => void
  onStartDetailFlow?: (id: string) => void
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
          <div style={{ marginBottom: pageFeatures.key === 'database' && feature.id === 'instance-list' ? 22 : 0 }}>
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

        {/* 인터랙티브 챌린지 */}
        {feature.challenge && (
          <div style={{ marginBottom: pageFeatures.key === 'database' && feature.id === 'instance-list' ? 22 : 0 }}>
            <SectionLabel>인터랙티브 챌린지</SectionLabel>
            <ChallengeCard featureId={feature.id} challenge={feature.challenge} />
          </div>
        )}

        {/* instance-list → Instance Detail 장애 분석 플로우 CTA */}
        {pageFeatures.key === 'database' && feature.id === 'instance-list' && onStartDetailFlow && (
          <div style={{
            background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
            border: '2px solid #0d9488',
            borderRadius: 12,
            padding: '16px 16px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>🔍</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#134e4a' }}>장애 분석 플로우로 이어가기</span>
            </div>
            <p style={{ fontSize: 13, color: '#0f766e', lineHeight: 1.75, margin: '0 0 14px', wordBreak: 'keep-all' }}>
              인스턴스를 클릭하면 슬라이드가 열리면서 <strong>액티브 세션 분석 가이드</strong>로 자동 전환됩니다. 실제 장애 대응 흐름을 가이드와 함께 체험해보세요.
            </p>
            <button
              onClick={() => onStartDetailFlow('drawer-active-session')}
              style={{
                width: '100%', padding: '11px 16px',
                background: '#0d9488', color: '#fff',
                border: 'none', borderRadius: 9,
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#0f766e' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0d9488' }}
            >
              <span>장애 분석 시작</span>
              <span style={{ fontSize: 16 }}>→</span>
            </button>
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
