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
      <body>{children}</body>
    </html>
  )
}
