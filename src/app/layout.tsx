import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { AppNav } from '@/components/app-nav'
import { APP_NAME } from '@/lib/brand'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'latin-ext'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'latin-ext'],
})

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: `${APP_NAME} — ewidencja faktur`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    'Ewidencja faktur kosztowych i sprzedażowych: pobieranie z KSeF, bufor, kategoryzacja i podgląd dokumentów.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="flex min-h-svh flex-col bg-background font-sans text-foreground">
        <AppNav showLogout={Boolean(process.env.APP_PASSWORD)} />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  )
}
