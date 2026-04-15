'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useGuideStore } from '@/stores/guideStore'

/* ── PostgreSQL 서브메뉴 ── */
const PG_SUBMENU = [
  { type: 'item',  href: '/db/postgresql/dashboard', label: '대시보드', badge: 3 },
  { type: 'item',  href: '/db/postgresql/multi',     label: '멀티뷰' },
  { type: 'item',  href: '/db/postgresql/single',    label: '싱글뷰' },
  { type: 'sep' },
  { type: 'group', label: 'SQL 분석' },
  { type: 'item',  href: '/db/postgresql/top-n',        label: 'Top N Analysis' },
  { type: 'item',  href: '/db/postgresql/search-sql',   label: 'Search SQL' },
  { type: 'sep' },
  { type: 'group', label: '세션 분석' },
  { type: 'item',  href: '/db/postgresql/search-session', label: 'Search Session' },
  { type: 'sep' },
  { type: 'group', label: '성능 분석' },
  { type: 'item',  href: '/db/postgresql/trend',     label: 'Trend Analysis' },
  { type: 'item',  href: '/db/postgresql/parameter', label: 'Parameter History' },
  { type: 'sep' },
  { type: 'group', label: '데이터영역 분석' },
  { type: 'item',  href: '/db/postgresql/object-size', label: 'Object Size' },
] as const

/* ── DB 카테고리 목록 ── */
const DB_CATEGORIES = [
  { id: 'postgresql', label: 'PostgreSQL', icon: <PgIcon />,  submenu: PG_SUBMENU },
  { id: 'mysql',      label: 'MySQL',      icon: <DbIcon />,  submenu: null },
  { id: 'oracle',     label: 'Oracle',     icon: <DbIcon />,  submenu: null },
  { id: 'mssql',      label: 'SQL Server', icon: <DbIcon />,  submenu: null },
  { id: 'mongodb',    label: 'MongoDB',    icon: <DbIcon />,  submenu: null },
  { id: 'tibero',     label: 'Tibero',     icon: <DbIcon />,  submenu: null },
  { id: 'cubrid',     label: 'Cubrid',     icon: <DbIcon />,  submenu: null },
  { id: 'altibase',   label: 'Altibase',   icon: <DbIcon />,  submenu: null },
]

/* ── 최상단 메뉴 ── */
const TOP_NAV = [
  { href: '/home',      label: '홈',      icon: <HomeIcon /> },
  { href: '/dashboard', label: '대시보드', icon: <DashIcon /> },
]

/* ── 하단 메뉴 ── */
const BOTTOM_NAV = [
  { href: '/performance/database', label: '성능분석', icon: <PerfIcon /> },
  { href: '/alert',                label: '알람',    icon: <AlertIcon /> },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed,  setCollapsed]  = useState(false)
  const [expandedDb, setExpandedDb] = useState<string | null>('postgresql')

  /* ── collapsed ── */
  if (collapsed) return (
    <aside style={{
      width: 44, minHeight: '100vh', flexShrink: 0,
      background: '#161b2e', borderRight: '1px solid #252d47',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      paddingTop: 14, gap: 4, position: 'sticky', top: 0, height: '100vh',
    }}>
      <button onClick={() => setCollapsed(false)} style={iconBtn}><MenuIcon /></button>
      <div style={{ height: 1, width: 28, background: '#252d47', margin: '4px 0' }} />
      {TOP_NAV.map(n => (
        <Link key={n.href} href={n.href} title={n.label} style={{ textDecoration: 'none' }}>
          <button style={{ ...iconBtn, color: pathname.startsWith(n.href) ? '#60a5fa' : '#7c8db5' }}>{n.icon}</button>
        </Link>
      ))}
      <div style={{ height: 1, width: 28, background: '#252d47', margin: '4px 0' }} />
      <Link href="/database" title="오버뷰" style={{ textDecoration: 'none' }}>
        <button style={{ ...iconBtn, color: pathname === '/database' ? '#60a5fa' : '#7c8db5' }}><OverviewIcon /></button>
      </Link>
      {DB_CATEGORIES.map(db => (
        <Link key={db.id} href={`/db/${db.id}`} title={db.label} style={{ textDecoration: 'none' }}>
          <button style={{ ...iconBtn, color: pathname.startsWith(`/db/${db.id}`) ? '#60a5fa' : '#7c8db5' }}>{db.icon}</button>
        </Link>
      ))}
      <div style={{ flex: 1 }} />
      {BOTTOM_NAV.map(n => (
        <Link key={n.href} href={n.href} title={n.label} style={{ textDecoration: 'none' }}>
          <button style={{ ...iconBtn, color: pathname.startsWith(n.href) ? '#60a5fa' : '#7c8db5' }}>{n.icon}</button>
        </Link>
      ))}
      <GuideToggleButton collapsed />
    </aside>
  )

  /* ── expanded ── */
  return (
    <aside style={{
      width: 220, minHeight: '100vh', flexShrink: 0,
      background: '#161b2e', borderRight: '1px solid #252d47',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh',
      overflowY: 'auto', overflowX: 'hidden',
    }}>

      {/* 브랜드 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', height: 48, borderBottom: '1px solid #252d47', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: 'linear-gradient(135deg,#f97316,#ef4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: '#fff', fontWeight: 800, flexShrink: 0,
          }}>e</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: 0.2 }}>exemONE</span>
        </div>
        <button onClick={() => setCollapsed(true)} style={{ ...iconBtn, color: '#7c8db5' }}><MenuIcon /></button>
      </div>

      <nav style={{ flex: 1, paddingBottom: 8 }}>

        {/* ── 홈 / 대시보드 ── */}
        {TOP_NAV.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} style={topItemStyle(active)}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.05)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = active ? 'rgba(96,165,250,.12)' : 'transparent' }}
            >
              <span style={{ color: active ? '#60a5fa' : '#7c8db5', width: 18, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 13, color: active ? '#fff' : '#9baacf', fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </Link>
          )
        })}

        {/* ── 데이터베이스 섹션 구분선 ── */}
        <div style={{ padding: '10px 14px 4px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#3d4f72', letterSpacing: 0.8, textTransform: 'uppercase' }}>Database</div>
        </div>

        {/* ── 오버뷰 (독립 항목) ── */}
        {(() => {
          const active = pathname === '/database' || pathname.startsWith('/database/')
          return (
            <Link href="/database" style={topItemStyle(active)}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.05)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = active ? 'rgba(96,165,250,.12)' : 'transparent' }}
            >
              <span style={{ color: active ? '#60a5fa' : '#7c8db5', width: 18, display: 'flex', justifyContent: 'center', flexShrink: 0 }}><OverviewIcon /></span>
              <span style={{ fontSize: 13, color: active ? '#fff' : '#9baacf', fontWeight: active ? 600 : 400 }}>오버뷰</span>
            </Link>
          )
        })()}

        {/* ── DBMS별 독립 카테고리 ── */}
        {DB_CATEGORIES.map(db => {
          const isExpanded = expandedDb === db.id
          const dbActive   = pathname.startsWith(`/db/${db.id}`)

          return (
            <div key={db.id}>
              {/* DBMS 헤더 행 */}
              <button
                onClick={() => setExpandedDb(isExpanded ? null : db.id)}
                style={{
                  width: '100%', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px',
                  background: (isExpanded || dbActive) ? 'rgba(96,165,250,.08)' : 'transparent',
                  borderLeft: (isExpanded || dbActive) ? '3px solid #3b82f6' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!isExpanded && !dbActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.05)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = (isExpanded || dbActive) ? 'rgba(96,165,250,.08)' : 'transparent' }}
              >
                <span style={{ color: (isExpanded || dbActive) ? '#60a5fa' : '#7c8db5', width: 18, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{db.icon}</span>
                <span style={{ fontSize: 13, color: (isExpanded || dbActive) ? '#fff' : '#9baacf', fontWeight: (isExpanded || dbActive) ? 600 : 400, flex: 1, textAlign: 'left' }}>{db.label}</span>
                <span style={{ fontSize: 10, color: '#4b5a82', transition: 'transform .2s', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>›</span>
              </button>

              {/* PostgreSQL 서브메뉴 */}
              {isExpanded && db.submenu && (
                <div style={{ background: '#0f1624' }}>
                  {db.submenu.map((entry, idx) => {
                    if (entry.type === 'sep') {
                      return <div key={idx} style={{ height: 1, background: '#1e2840', margin: '2px 0' }} />
                    }
                    if (entry.type === 'group') {
                      return (
                        <div key={idx} style={{ padding: '6px 14px 2px 32px', fontSize: 10, color: '#3d4f72', fontWeight: 700, letterSpacing: 0.5 }}>
                          {'label' in entry ? entry.label : ''}
                        </div>
                      )
                    }
                    const it = entry as { type: 'item'; href: string; label: string; badge?: number }
                    const active = pathname === it.href
                    return (
                      <Link key={it.href} href={it.href}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '7px 14px 7px 32px', textDecoration: 'none',
                          background: active ? 'rgba(59,130,246,.15)' : 'transparent',
                          borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
                        }}
                        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.04)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = active ? 'rgba(59,130,246,.15)' : 'transparent' }}
                      >
                        <span style={{ fontSize: 12, color: active ? '#fff' : '#9baacf', fontWeight: active ? 600 : 400, flex: 1 }}>{it.label}</span>
                        {'badge' in it && it.badge ? (
                          <span style={{ fontSize: 10, background: '#1d4ed8', color: '#fff', borderRadius: 8, padding: '0 5px', fontWeight: 700, lineHeight: '16px' }}>{it.badge}</span>
                        ) : null}
                      </Link>
                    )
                  })}
                </div>
              )}

              {/* 다른 DBMS: 준비 중 */}
              {isExpanded && !db.submenu && (
                <div style={{ padding: '8px 14px 8px 32px', fontSize: 11, color: '#3d4f72', fontStyle: 'italic' }}>준비 중</div>
              )}
            </div>
          )
        })}

        {/* ── 구분선 ── */}
        <div style={{ height: 1, background: '#252d47', margin: '8px 14px' }} />

        {/* ── 하단 메뉴 ── */}
        {BOTTOM_NAV.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} style={topItemStyle(active)}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.05)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = active ? 'rgba(96,165,250,.12)' : 'transparent' }}
            >
              <span style={{ color: active ? '#60a5fa' : '#7c8db5', width: 18, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 13, color: active ? '#fff' : '#9baacf', fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </Link>
          )
        })}

      </nav>

      <GuideToggleButton />

      {/* 하단 프로필 */}
      <div style={{ borderTop: '1px solid #252d47', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#2a3558', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>👤</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#c8d0e8' }}>관리자</div>
          <div style={{ fontSize: 10, color: '#4b5a82' }}>master</div>
        </div>
      </div>
    </aside>
  )
}

/* ── 스타일 헬퍼 ── */
function topItemStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 14px', cursor: 'pointer', textDecoration: 'none',
    background: active ? 'rgba(96,165,250,.12)' : 'transparent',
    borderLeft: active ? '3px solid #60a5fa' : '3px solid transparent',
  }
}

const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#7c8db5', padding: 6, borderRadius: 4,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

/* ── 아이콘 ── */
/* ── 가이드 토글 버튼 ── */
function GuideToggleButton({ collapsed }: { collapsed?: boolean }) {
  const { isOpen, toggle } = useGuideStore()
  if (collapsed) return (
    <div style={{ borderTop: '1px solid #252d47', paddingTop: 8, paddingBottom: 10, width: '100%', display: 'flex', justifyContent: 'center' }}>
      <button
        onClick={toggle}
        title="기능 가이드"
        style={{ ...iconBtn, color: isOpen ? '#60a5fa' : '#7c8db5', background: isOpen ? 'rgba(96,165,250,.12)' : 'none', borderRadius: 6 }}
      >
        <BookIcon />
      </button>
    </div>
  )
  return (
    <div style={{ borderTop: '1px solid #252d47', padding: '8px 10px', flexShrink: 0 }}>
      <button
        onClick={toggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
          background: isOpen ? 'rgba(96,165,250,.15)' : 'rgba(255,255,255,.04)',
          border: isOpen ? '1px solid rgba(96,165,250,.3)' : '1px solid transparent',
          transition: 'all .15s',
        }}
      >
        <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, background: isOpen ? '#1d4ed8' : '#2a3558', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookIcon />
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: isOpen ? '#93c5fd' : '#c8d0e8' }}>기능 가이드</div>
          <div style={{ fontSize: 10, color: '#4b5a82' }}>{isOpen ? '가이드 닫기' : '기능 설명 열기'}</div>
        </div>
        {isOpen && <span style={{ marginLeft: 'auto', fontSize: 10, background: '#1d4ed8', color: '#fff', padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>ON</span>}
      </button>
    </div>
  )
}

function BookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  )
}

function MenuIcon()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> }
function HomeIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg> }
function DashIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> }
function OverviewIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/></svg> }
function DbIcon()       { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> }
function PgIcon()       { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><line x1="12" y1="14" x2="12" y2="22"/></svg> }
function PerfIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg> }
function AlertIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> }
