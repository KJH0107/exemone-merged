'use client'
import { useState } from 'react'
import { DB_TYPES } from '@/lib/mock/instances'

const GROUPS = ['All','altibase','azure','azure_sqlserver','DB demo1','DB demo2','DB demo3','DB demo4','DB demo5','DB demo6','DB demo7','EXEM Mongo']

interface FilterPanelProps {
  selectedTypes: string[]
  selectedGroups: string[]
  onTypeChange: (types: string[]) => void
  onGroupChange: (groups: string[]) => void
}

export default function FilterPanel({ selectedTypes, selectedGroups, onTypeChange, onGroupChange }: FilterPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [typeSearch, setTypeSearch] = useState('')
  const [groupSearch, setGroupSearch] = useState('')

  const toggleType = (t: string) => {
    if (t === 'All') { onTypeChange(['All']); return }
    const next = selectedTypes.includes(t)
      ? selectedTypes.filter(x => x !== t && x !== 'All')
      : [...selectedTypes.filter(x => x !== 'All'), t]
    onTypeChange(next.length ? next : ['All'])
  }

  const toggleGroup = (g: string) => {
    if (g === 'All') { onGroupChange(['All']); return }
    const next = selectedGroups.includes(g)
      ? selectedGroups.filter(x => x !== g && x !== 'All')
      : [...selectedGroups.filter(x => x !== 'All'), g]
    onGroupChange(next.length ? next : ['All'])
  }

  if (collapsed) return (
    <div style={{ width: 24, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 12, cursor: 'pointer' }}
      onClick={() => setCollapsed(false)}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>▶</span>
    </div>
  )

  return (
    <div style={{ width: 200, flexShrink: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>필터</span>
        <button onClick={() => setCollapsed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12 }}>⊟</button>
      </div>
      <div style={{ padding: 12, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>

        {/* DB 타입 */}
        <Section title="데이터베이스 타입">
          <input placeholder="검색" value={typeSearch} onChange={e => setTypeSearch(e.target.value)} style={inputStyle} />
          {DB_TYPES.filter(t => t.toLowerCase().includes(typeSearch.toLowerCase())).map(t => (
            <CheckItem key={t} label={t}
              checked={selectedTypes.includes('All') || selectedTypes.includes(t)}
              onChange={() => toggleType(t)} />
          ))}
        </Section>

        {/* 인스턴스 그룹 */}
        <Section title="인스턴스 그룹">
          <input placeholder="검색" value={groupSearch} onChange={e => setGroupSearch(e.target.value)} style={inputStyle} />
          {GROUPS.filter(g => g.toLowerCase().includes(groupSearch.toLowerCase())).map(g => (
            <CheckItem key={g} label={g}
              checked={selectedGroups.includes('All') || selectedGroups.includes(g)}
              onChange={() => toggleGroup(g)} />
          ))}
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ marginBottom: 16 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{open ? '∧' : '∨'}</span>
      </div>
      {open && children}
    </div>
  )
}

function CheckItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ accentColor: '#3b82f6' }} />
      <span style={{ fontSize: 12, color: checked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</span>
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '5px 8px', border: '1px solid var(--border)',
  borderRadius: 4, fontSize: 12, marginBottom: 6, outline: 'none',
}
