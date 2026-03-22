import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'exemONE DB Monitoring',
  description: 'Enterprise DB Monitoring Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{ flex: 1, overflow: 'hidden', background: 'var(--main-bg)', display: 'flex', flexDirection: 'column' }}>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
