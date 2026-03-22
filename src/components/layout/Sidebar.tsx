'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/* ── 최상위 메뉴 ── */
const TOP_NAV = [
  { href: '/home',                 label: '홈',     icon: <HomeIcon /> },
  { href: '/dashboard',            label: '대시보드', icon: <DashIcon /> },
  { href: '/database',             label: '오버뷰',  icon: <DbIcon /> },
]

/* ── DB 타입별 메뉴 (아이콘은 추후 변경 예정) ── */
const DB_NAV = [
  { href: '/db/postgresql', label: 'PostgreSQL' },
  { href: '/db/mysql',      label: 'MySQL'      },
  { href: '/db/oracle',     label: 'Oracle'     },
  { href: '/db/mssql',      label: 'SQL Server' },
  { href: '/db/mongodb',    label: 'MongoDB'    },
  { href: '/db/tibero',     label: 'Tibero'     },
  { href: '/db/cubrid',     label: 'Cubrid'     },
  { href: '/db/altibase',   label: 'Altibase'   },
]

/* ── 하단 메뉴 ── */
const BOTTOM_NAV = [
  { href: '/performance/database', label: '성능분석', icon: <PerfIcon /> },
  { href: '/alert',                label: '알람',   icon: <AlertIcon /> },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const navItemStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 14px', cursor: 'pointer', textDecoration: 'none',
    background: active ? 'rgba(96,165,250,.12)' : 'transparent',
    borderLeft: active ? '3px solid #60a5fa' : '3px solid transparent',
  })

  const dbItemStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 14px 8px 28px', cursor: 'pointer', textDecoration: 'none',
    background: active ? 'rgba(96,165,250,.12)' : 'transparent',
    borderLeft: active ? '3px solid #60a5fa' : '3px solid transparent',
  })

  /* ── collapsed ── */
  if (collapsed) return (
    <aside style={{
      width: 44, minHeight: '100vh', flexShrink: 0,
      background: '#161b2e', borderRight: '1px solid #252d47',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      paddingTop: 14, gap: 4, position: 'sticky', top: 0, height: '100vh',
    }}>
      <button onClick={() => setCollapsed(false)} style={iconBtn}><MenuIcon /></button>
      <div style={{ height: 1, width: 28, background: '#252d47', margin: '6px 0' }} />
      {[...TOP_NAV, ...BOTTOM_NAV].map(n => (
        <Link key={n.href} href={n.href} title={n.label} style={{ textDecoration: 'none' }}>
          <button style={{ ...iconBtn, color: pathname.startsWith(n.href) ? '#60a5fa' : '#7c8db5' }}>
            {n.icon}
          </button>
        </Link>
      ))}
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
        <button onClick={() => setCollapsed(true)} style={{ ...iconBtn, color: '#7c8db5' }}>
          <MenuIcon />
        </button>
      </div>

      {/* 네비게이션 */}
      <nav style={{ flex: 1, paddingBottom: 8 }}>

        {/* 상단 메뉴 (홈, 대시보드, 오버뷰) */}
        {TOP_NAV.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} style={navItemStyle(active)}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.05)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = active ? 'rgba(96,165,250,.12)' : 'transparent' }}
            >
              <span style={{ color: active ? '#60a5fa' : '#7c8db5', width: 18, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 13, color: active ? '#fff' : '#9baacf', fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </Link>
          )
        })}

        {/* DBMS 섹션 레이블 */}
        <div style={{ padding: '10px 14px 4px 14px', fontSize: 10, fontWeight: 700, color: '#3d4f72', letterSpacing: 0.8, textTransform: 'uppercase' }}>
          DBMS
        </div>

        {/* DB 타입 메뉴 (flat) */}
        {DB_NAV.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} style={dbItemStyle(active)}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.05)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = active ? 'rgba(96,165,250,.12)' : 'transparent' }}
            >
              <span style={{ fontSize: 13, color: active ? '#fff' : '#9baacf', fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </Link>
          )
        })}

        {/* 구분선 */}
        <div style={{ height: 1, background: '#252d47', margin: '8px 14px' }} />

        {/* 하단 메뉴 (성능분석, 알람) */}
        {BOTTOM_NAV.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} style={navItemStyle(active)}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.05)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = active ? 'rgba(96,165,250,.12)' : 'transparent' }}
            >
              <span style={{ color: active ? '#60a5fa' : '#7c8db5', width: 18, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 13, color: active ? '#fff' : '#9baacf', fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </Link>
          )
        })}

      </nav>

      {/* 하단 */}
      <div style={{ borderTop: '1px solid #252d47', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#2a3558', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>👤</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#c8d0e8' }}>사용자 가이드</div>
          <div style={{ fontSize: 10, color: '#4b5a82' }}>프로필</div>
        </div>
      </div>
    </aside>
  )
}

const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#7c8db5', padding: 6, borderRadius: 4,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

function MenuIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> }
function HomeIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg> }
function DashIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> }
function DbIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> }
function PerfIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg> }
function AlertIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> }
