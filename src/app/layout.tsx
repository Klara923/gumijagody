import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { AppNav } from '@/components/app-nav'

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
  title: 'Gumijagoda — system zarządzania fakturami',
  description:
    'Ewidencja faktur kosztowych i sprzedażowych: pobieranie z KSeF, bufor, kategoryzacja i podgląd dokumentów.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <AppNav />
        {children}
      </body>
    </html>
  )
}
