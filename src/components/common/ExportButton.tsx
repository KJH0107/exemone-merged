'use client'
import { useState } from 'react'

export type ExportColumn = { key: string; label: string }
export type ExportRow = Record<string, string | number | boolean | null>

interface ExportButtonProps {
  label?: string
  filename?: string
  columns: ExportColumn[]
  rows: ExportRow[]
}

/**
 * 내보내기 버튼 + 모달
 * - CSV: 실제 Blob 다운로드 생성
 * - Excel / PDF: TODO (이후 라이브러리 연동 예정)
 */
export default function ExportButton({ label = '내보내기', filename = 'export', columns, rows }: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('csv')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleExport = () => {
    setLoading(true)
    setTimeout(() => {
      if (format === 'csv') {
        downloadCsv(columns, rows, filename)
      } else {
        // TODO: Excel — xlsx 라이브러리 연동 예정 (sheetjs / exceljs)
        // TODO: PDF  — jsPDF + autoTable 연동 예정
        console.info(`[ExportButton] ${format} export — TODO: 라이브러리 연동 필요`)
        alert(`${format.toUpperCase()} 내보내기는 추후 지원 예정입니다.\n현재는 CSV를 이용해 주세요.`)
      }
      setLoading(false)
      setDone(true)
      setTimeout(() => { setDone(false); setOpen(false) }, 1200)
    }, 600)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 14px', fontSize: 12,
        border: '1px solid var(--border)', borderRadius: 5,
        background: '#fff', cursor: 'pointer', color: 'var(--text-secondary)',
      }}>
        <ExportIcon /> {label}
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 10, width: 380, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,.18)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>데이터 내보내기</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>
              {rows.length.toLocaleString()}행 · {columns.length}열
            </div>

            {/* 포맷 선택 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
              {([
                { key: 'csv',   label: 'CSV',   desc: '범용 텍스트',    icon: '📄', avail: true  },
                { key: 'excel', label: 'Excel', desc: '.xlsx (예정)',   icon: '📊', avail: false },
                { key: 'pdf',   label: 'PDF',   desc: '보고서 (예정)', icon: '📑', avail: false },
              ] as const).map(f => (
                <button key={f.key} onClick={() => setFormat(f.key)} style={{
                  padding: '10px 8px', borderRadius: 6, cursor: 'pointer', textAlign: 'center',
                  border: `1.5px solid ${format === f.key ? '#1d4ed8' : 'var(--border)'}`,
                  background: format === f.key ? '#eff6ff' : '#fff',
                  opacity: f.avail ? 1 : 0.5,
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: format === f.key ? '#1d4ed8' : 'var(--text-primary)' }}>{f.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{f.desc}</div>
                </button>
              ))}
            </div>

            {/* 파일명 */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>파일명</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <span style={{ padding: '6px 10px', fontSize: 12, background: '#f9fafb', borderRight: '1px solid var(--border)', color: 'var(--text-muted)' }}>{filename}</span>
                <span style={{ padding: '6px 10px', fontSize: 12, color: 'var(--text-muted)' }}>.{format}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setOpen(false)} style={{ padding: '7px 18px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer', background: '#fff' }}>취소</button>
              <button onClick={handleExport} disabled={loading || done} style={{
                padding: '7px 20px', fontSize: 13, border: 'none', borderRadius: 5,
                cursor: loading || done ? 'default' : 'pointer',
                background: done ? '#059669' : '#1d4ed8', color: '#fff', fontWeight: 600,
                minWidth: 80,
              }}>
                {done ? '완료 ✓' : loading ? '처리 중...' : '내보내기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function downloadCsv(columns: ExportColumn[], rows: ExportRow[], filename: string) {
  const header = columns.map(c => `"${c.label}"`).join(',')
  const body = rows.map(row =>
    columns.map(c => {
      const v = row[c.key]
      if (v === null || v === undefined) return ''
      return typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : String(v)
    }).join(',')
  ).join('\n')

  const bom = '\uFEFF'  // BOM for Excel 한글 깨짐 방지
  const blob = new Blob([bom + header + '\n' + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function ExportIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="7,10 12,15 17,10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}
