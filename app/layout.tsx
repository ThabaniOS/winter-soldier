import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Winter Soldier',
  description: '90-day deliberate living. 18 May — 16 August 2026.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <nav
          style={{
            borderBottom: '1px solid #383838',
            padding: '16px 32px',
            display: 'flex',
            gap: '26px',
          }}
        >
          <a href="/" style={{ color: '#ffffff', letterSpacing: '0.24px' }}>HOME</a>
          <a href="/log" style={{ color: '#ffffff', letterSpacing: '0.24px' }}>LOG</a>
          <a href="/breathe" style={{ color: '#ffffff', letterSpacing: '0.24px' }}>BREATHE</a>
          <a href="/log/history" style={{ color: '#ffffff', letterSpacing: '0.24px' }}>HISTORY</a>
        </nav>
        {children}
      </body>
    </html>
  )
}
