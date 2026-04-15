import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import Providers from './providers'
import GuidePanelLayout from '@/components/guide/GuidePanelLayout'

export const metadata: Metadata = {
  title: 'exemONE DB Monitoring',
  description: 'Enterprise DB Monitoring Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-theme="light">
      <head />
      <body>
        <Providers>
          {/* 가이드 패널을 flex row 안에 배치 — 열리면 content가 옆으로 밀림 */}
          <div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <main style={{ flex: 1, overflow: 'hidden', background: 'var(--main-bg)', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {children}
            </main>
            <GuidePanelLayout />
          </div>
        </Providers>
      </body>
    </html>
  )
}
