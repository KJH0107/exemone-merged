'use client'
import type { ScenarioKey, Scenario, ScenarioFeature } from '@/lib/mock/scenarios'

interface Props {
  scenarios: Record<ScenarioKey, Scenario>
  activeKey: ScenarioKey
  onSelect: (key: ScenarioKey) => void
  activeFeature: string | null
  onFeatureClick: (id: string | null) => void
}

export default function ScenarioPanel({ scenarios, activeKey, onSelect, activeFeature, onFeatureClick }: Props) {
  const scenario = scenarios[activeKey]

  return (
    <div style={{
      width: 340, flexShrink: 0, background: '#fff',
      borderLeft: '1px solid #e3e7ea',
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* 패널 헤더 */}
      <div style={{
        padding: '14px 18px 10px',
        borderBottom: '1px solid #e3e7ea',
        background: '#f8fafc',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9baacf', letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' }}>
          시나리오 선택
        </div>

        {/* 시나리오 카드 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(Object.values(scenarios) as Scenario[]).map(s => (
            <button
              key={s.key}
              onClick={() => { onSelect(s.key); onFeatureClick(null) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                border: activeKey === s.key ? '2px solid #3b82f6' : '2px solid transparent',
                background: activeKey === s.key ? '#eff6ff' : '#fff',
                boxShadow: activeKey === s.key ? '0 0 0 0px' : '0 1px 3px rgba(0,0,0,.06)',
                transition: 'all .15s', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{s.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13, fontWeight: activeKey === s.key ? 700 : 500,
                  color: activeKey === s.key ? '#1d4ed8' : '#282c32',
                }}>
                  {s.label}
                </div>
                {activeKey === s.key && (
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>
                    {s.highlightMessage}
                  </div>
                )}
              </div>
              {activeKey === s.key && (
                <span style={{
                  ...s.badge, fontSize: 10, fontWeight: 700,
                  padding: '2px 6px', borderRadius: 99,
                }}>
                  활성
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 기능 안내 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 18px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9baacf', letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' }}>
          주요 기능 포인트
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {scenario.features.map((f: ScenarioFeature) => (
            <FeatureCard
              key={f.id}
              feature={f}
              active={activeFeature === f.id}
              onClick={() => onFeatureClick(activeFeature === f.id ? null : f.id)}
            />
          ))}
        </div>
      </div>

      {/* 하단 시나리오 설명 */}
      <div style={{
        padding: '12px 18px',
        borderTop: '1px solid #e3e7ea',
        background: '#f8fafc',
      }}>
        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
          💡 {scenario.description}
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ feature, active, onClick }: {
  feature: ScenarioFeature
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        padding: '10px 12px', borderRadius: 8,
        border: active ? '1.5px solid #3b82f6' : '1.5px solid #e3e7ea',
        background: active ? '#eff6ff' : '#fff',
        transition: 'all .15s',
      }}
    >
      <div style={{
        fontSize: 12, fontWeight: 600,
        color: active ? '#1d4ed8' : '#282c32',
        marginBottom: active ? 6 : 0,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          background: active ? '#3b82f6' : '#c9cdd2',
        }} />
        {feature.label}
      </div>

      {active && (
        <>
          <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, marginBottom: 8 }}>
            {feature.description}
          </div>
          <div style={{
            fontSize: 11, color: '#0369a1',
            background: '#f0f9ff', borderRadius: 6,
            padding: '6px 10px', lineHeight: 1.5,
          }}>
            💡 {feature.tip}
          </div>
        </>
      )}
    </button>
  )
}
