'use client'
import { useState, useCallback, useEffect } from 'react'
import GridLayout, { Layout } from 'react-grid-layout'
import Header from '@/components/layout/Header'
import { mockInstances, summarize } from '@/lib/mock/instances'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const summary = summarize(mockInstances)

// 위젯 타입 정의
type WidgetId = 'status-summary' | 'cpu-avg' | 'session-total' | 'critical-list' | 'instance-mini' | 'alert-panel'

const WIDGET_TITLES: Record<WidgetId, string> = {
  'status-summary':  'DB 상태 요약',
  'cpu-avg':         'CPU 평균 사용률',
  'session-total':   '전체 활성 세션',
  'critical-list':   '장애 인스턴스',
  'instance-mini':   '인스턴스 현황',
  'alert-panel':     '알림 현황',
}

const DEFAULT_LAYOUT: Layout[] = [
  { i: 'status-summary', x: 0, y: 0, w: 8, h: 3 },
  { i: 'cpu-avg',        x: 8, y: 0, w: 2, h: 3 },
  { i: 'session-total',  x: 10, y: 0, w: 2, h: 3 },
  { i: 'critical-list',  x: 0, y: 3, w: 4, h: 5 },
  { i: 'instance-mini',  x: 4, y: 3, w: 8, h: 5 },
]

const criticalInstances = mockInstances.filter(i => i.status === 'critical').slice(0, 5)
const avgCpu = Math.round(mockInstances.reduce((s, i) => s + i.cpuUsage, 0) / mockInstances.length)
const totalSessions = mockInstances.reduce((s, i) => s + i.activeSessionCount, 0)

export default function HomePage() {
  const [layout, setLayout] = useState<Layout[]>(DEFAULT_LAYOUT)
  const [containerWidth, setContainerWidth] = useState(1200)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // 최초 방문 시 자동 표시
  useEffect(() => {
    const done = localStorage.getItem('exemone_onboarding_done')
    if (!done) setShowOnboarding(true)
  }, [])

  const closeOnboarding = (completed: boolean) => {
    if (completed) localStorage.setItem('exemone_onboarding_done', '1')
    setShowOnboarding(false)
  }

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (node) setContainerWidth(node.offsetWidth)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="홈" />

      <div ref={ref} style={{ flex: 1, overflow: 'auto', padding: 12, background: 'var(--main-bg)' }}>
        {/* 온보딩 재시작 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button onClick={() => setShowOnboarding(true)} style={{
            fontSize: 11, color: 'var(--text-muted)', background: '#fff',
            border: '1px solid var(--border)', borderRadius: 5,
            padding: '4px 10px', cursor: 'pointer',
          }}>? 시작 가이드</button>
        </div>

        <GridLayout
          layout={layout}
          cols={12}
          rowHeight={60}
          width={containerWidth - 24}
          onLayoutChange={setLayout}
          draggableHandle=".widget-handle"
          margin={[12, 12]}
        >
          <div key="status-summary"><Widget id="status-summary"><StatusSummaryWidget /></Widget></div>
          <div key="cpu-avg"><Widget id="cpu-avg"><NumberWidget label="CPU 평균" value={`${avgCpu}%`} color={avgCpu > 80 ? '#dc2626' : avgCpu > 60 ? '#d97706' : '#059669'} /></Widget></div>
          <div key="session-total"><Widget id="session-total"><NumberWidget label="활성 세션" value={totalSessions} color="#1d4ed8" /></Widget></div>
          <div key="critical-list"><Widget id="critical-list"><CriticalListWidget /></Widget></div>
          <div key="instance-mini"><Widget id="instance-mini"><InstanceMiniWidget /></Widget></div>
        </GridLayout>
      </div>

      {showOnboarding && <OnboardingWizard onClose={closeOnboarding} />}
    </div>
  )
}

function Widget({ id, children }: { id: WidgetId; children: React.ReactNode }) {
  return (
    <div style={{
      height: '100%', background: '#fff',
      border: '1px solid var(--border)', borderRadius: 8,
      display: 'flex', flexDirection: 'column',
      boxShadow: 'var(--card-shadow)', overflow: 'hidden',
    }}>
      <div className="widget-handle" style={{
        padding: '8px 14px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'grab', background: 'var(--grid-header-bg)', flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {WIDGET_TITLES[id]}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>⠿</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
        {children}
      </div>
    </div>
  )
}

function StatusSummaryWidget() {
  const cards = [
    { label: '전체',  value: summary.total,    color: '#1d4ed8', bg: '#eff6ff' },
    { label: '활성',  value: summary.active,   color: '#059669', bg: '#ecfdf5' },
    { label: '경고',  value: summary.warning,  color: '#d97706', bg: '#fffbeb' },
    { label: '장애',  value: summary.critical, color: '#dc2626', bg: '#fef2f2' },
    { label: '미수집',value: summary.nosignal, color: '#6b7280', bg: '#f9fafb' },
  ]
  return (
    <div style={{ display: 'flex', gap: 12, height: '100%', alignItems: 'center' }}>
      {cards.map(c => (
        <div key={c.label} style={{
          flex: 1, background: c.bg, borderRadius: 8, padding: '16px 12px',
          textAlign: 'center', border: `1px solid ${c.color}22`,
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{c.label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
        </div>
      ))}
    </div>
  )
}

function NumberWidget({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

function CriticalListWidget() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {criticalInstances.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#059669', fontSize: 13, paddingTop: 20 }}>✓ 장애 없음</div>
      ) : criticalInstances.map(inst => (
        <div key={inst.id} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 10px', background: '#fef2f2', borderRadius: 6, border: '1px solid #fca5a5',
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626' }}>{inst.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inst.group}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#dc2626' }}>CPU {inst.cpuUsage.toFixed(1)}%</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inst.dbType}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function InstanceMiniWidget() {
  const top10 = mockInstances.slice(0, 10)
  const STATUS_COLOR: Record<string, string> = {
    active: '#059669', warning: '#d97706', critical: '#dc2626', nosignal: '#9ca3af',
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          {['인스턴스', 'DB', '상태', 'CPU', 'MEM', '세션'].map(h => (
            <th key={h} style={{ padding: '4px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {top10.map(inst => (
          <tr key={inst.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
            <td style={{ padding: '5px 8px', color: '#1d4ed8', fontWeight: 500 }}>{inst.name}</td>
            <td style={{ padding: '5px 8px', color: 'var(--text-muted)' }}>{inst.dbType}</td>
            <td style={{ padding: '5px 8px' }}>
              <span style={{ color: STATUS_COLOR[inst.status], fontSize: 11, fontWeight: 600 }}>
                ● {inst.status}
              </span>
            </td>
            <td style={{ padding: '5px 8px', color: inst.cpuUsage > 80 ? '#dc2626' : 'var(--text-primary)' }}>
              {inst.cpuUsage.toFixed(1)}%
            </td>
            <td style={{ padding: '5px 8px', color: inst.memoryUsage > 85 ? '#dc2626' : 'var(--text-primary)' }}>
              {inst.memoryUsage.toFixed(1)}%
            </td>
            <td style={{ padding: '5px 8px' }}>{inst.activeSessionCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ─────────────────────────────────────────────────────────────────
// 온보딩 가이드 마법사 (4단계)
// ─────────────────────────────────────────────────────────────────
const STEPS = [
  {
    title: 'exemONE에 오신 것을 환영합니다',
    subtitle: '엔터프라이즈 DB 모니터링 플랫폼',
    icon: '◈',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          exemONE은 Oracle, MySQL, PostgreSQL, SQL Server 등 다양한 DB를<br />
          통합 모니터링할 수 있는 엔터프라이즈 플랫폼입니다.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { icon: '🏠', label: '홈', desc: '위젯 기반 실시간 현황판' },
            { icon: '📊', label: '대시보드', desc: '커스텀 모니터링 보드' },
            { icon: '🗄', label: '데이터베이스', desc: 'DB 인스턴스 상세 분석' },
            { icon: '📈', label: '성능분석', desc: '트렌드·이상탐지 리포트' },
          ].map(f => (
            <div key={f.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{f.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'DB 인스턴스 등록',
    subtitle: '모니터링할 DB를 연결하세요',
    icon: '🗄',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          현재는 Mock 데이터로 동작합니다. 실제 운영 환경에서는 아래 절차로 인스턴스를 등록합니다.
        </p>
        {[
          { step: 1, title: '에이전트 설치',      desc: 'DB 서버에 exemONE Agent를 설치합니다.',             badge: 'Agent v3.0.508.64' },
          { step: 2, title: '연결 정보 입력',      desc: 'Host IP, Port, 접속 계정을 입력합니다.',            badge: 'Oracle / MySQL / PostgreSQL / SQL Server' },
          { step: 3, title: '모니터링 그룹 지정',  desc: 'DB 인스턴스를 그룹으로 묶어 관리합니다.',           badge: 'DB demo1 ~ DB demo7' },
          { step: 4, title: '수집 주기 설정',      desc: '메트릭 수집 주기를 설정합니다. (기본 5초)',          badge: '5s / 10s / 30s' },
        ].map(s => (
          <div key={s.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1d4ed8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              {s.step}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{s.desc}</div>
              <span style={{ fontSize: 10, background: '#eff6ff', color: '#1d4ed8', padding: '2px 7px', borderRadius: 4 }}>{s.badge}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: '대시보드 구성',
    subtitle: '나만의 모니터링 화면을 만드세요',
    icon: '📊',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          대시보드 메뉴에서 위젯을 자유롭게 배치해 맞춤형 모니터링 화면을 구성할 수 있습니다.
        </p>
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>사용 가능한 위젯 타입</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['🔢','메트릭 카드','단일 수치 표시'],
              ['📈','라인 차트','시계열 트렌드'],
              ['🍩','도넛/게이지','사용률 시각화'],
              ['📊','바 차트','카테고리 비교'],
              ['🗂','Top SQL','상위 SQL 목록'],
              ['⚡','Scatter','응답시간 분포'],
              ['🔔','알림 목록','이벤트 현황'],
              ['🟢','상태 요약','인스턴스 현황'],
            ].map(([icon, name, desc]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: '#fff', borderRadius: 6, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#92400e' }}>
          💡 <b>Tip.</b> 대시보드 목록에서 카드를 클릭하면 위젯 빌더가 열립니다. 위젯을 드래그해 자유롭게 배치하고 저장하세요.
        </div>
      </div>
    ),
  },
  {
    title: '준비 완료!',
    subtitle: '이제 exemONE을 시작하세요',
    icon: '✅',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 64 }}>🎉</div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 380 }}>
          기본 설정이 완료되었습니다.<br />
          홈 화면의 위젯을 드래그해 배치를 변경하거나,<br />
          <b>데이터베이스</b> 메뉴에서 인스턴스 현황을 확인하세요.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { icon: '🗄', label: '데이터베이스 보기', color: '#1d4ed8', bg: '#eff6ff' },
            { icon: '📊', label: '대시보드 만들기',   color: '#059669', bg: '#ecfdf5' },
            { icon: '📈', label: '성능분석 보기',     color: '#7c3aed', bg: '#f5f3ff' },
          ].map(b => (
            <div key={b.label} style={{ padding: '12px 16px', background: b.bg, borderRadius: 8, border: `1px solid ${b.color}33`, cursor: 'pointer' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{b.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: b.color }}>{b.label}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          이 가이드는 홈 화면 우측 상단 <b>"? 시작 가이드"</b> 버튼으로 다시 볼 수 있습니다.
        </div>
      </div>
    ),
  },
]

function OnboardingWizard({ onClose }: { onClose: (completed: boolean) => void }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1
  const isFirst = step === 0

  return (
    <>
      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 300 }} />

      {/* 마법사 카드 */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#fff', borderRadius: 16, zIndex: 301,
        width: 560, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,.25)',
        overflow: 'hidden',
      }}>
        {/* 상단 진행 바 */}
        <div style={{ height: 4, background: '#e3e7ea' }}>
          <div style={{
            height: '100%', background: '#1d4ed8', borderRadius: 4,
            width: `${((step + 1) / STEPS.length) * 100}%`,
            transition: 'width .35s ease',
          }} />
        </div>

        {/* 헤더 */}
        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 24 }}>{current.icon}</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{current.title}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{current.subtitle}</div>
          </div>
          <button onClick={() => onClose(false)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 20, lineHeight: 1, padding: '0 2px',
          }}>×</button>
        </div>

        {/* 단계 표시 */}
        <div style={{ padding: '12px 28px 0', display: 'flex', gap: 6 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height: 4, flex: 1, borderRadius: 2,
              background: i <= step ? '#1d4ed8' : '#e3e7ea',
              transition: 'background .3s',
            }} />
          ))}
        </div>
        <div style={{ padding: '4px 28px 0', fontSize: 11, color: 'var(--text-muted)' }}>
          {step + 1} / {STEPS.length}
        </div>

        {/* 콘텐츠 */}
        <div style={{ padding: '20px 28px', flex: 1, overflowY: 'auto' }}>
          {current.content}
        </div>

        {/* 하단 버튼 */}
        <div style={{
          padding: '16px 28px', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <button
            onClick={() => onClose(false)}
            style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >건너뛰기</button>

          <div style={{ display: 'flex', gap: 8 }}>
            {!isFirst && (
              <button onClick={() => setStep(s => s - 1)} style={{
                padding: '8px 18px', border: '1px solid var(--border)', borderRadius: 7,
                background: '#fff', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer',
              }}>← 이전</button>
            )}
            <button
              onClick={() => isLast ? onClose(true) : setStep(s => s + 1)}
              style={{
                padding: '8px 22px', background: '#1d4ed8', color: '#fff',
                border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontWeight: 600,
              }}
            >{isLast ? '시작하기 🚀' : '다음 →'}</button>
          </div>
        </div>
      </div>
    </>
  )
}
