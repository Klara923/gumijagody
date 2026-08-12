'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Start' },
  { href: '/documents', label: 'Rejestr' },
  { href: '/buffer', label: 'Bufor' },
  { href: '/documents/new', label: 'Nowy' },
  { href: '/documents/upload', label: 'Upload' },
  { href: '/ksef/import', label: 'KSeF' },
  { href: '/ksef/schedule', label: 'Harmonogram' },
  { href: '/categories', label: 'Kategorie' },
  { href: '/contractors', label: 'Kontrahenci' },
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-3">
        <span className="mr-3 text-sm font-semibold tracking-tight text-zinc-900">Gumijagoda</span>
        <nav className="flex flex-wrap gap-1">
          {links.map((link) => {
            const active = isActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? 'rounded-md bg-zinc-900 px-2.5 py-1.5 text-sm text-white'
                    : 'rounded-md px-2.5 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
