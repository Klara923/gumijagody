'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

const primary = [
  { href: '/documents', label: 'Rejestr' },
  { href: '/buffer', label: 'Bufor' },
  { href: '/documents/new', label: 'Nowy' },
  { href: '/documents/upload', label: 'Upload' },
  { href: '/ksef/import', label: 'KSeF' },
  { href: '/ksef/schedule', label: 'Harmonogram' },
]

const settings = [
  { href: '/document-types', label: 'Typy' },
  { href: '/categories', label: 'Kategorie' },
  { href: '/contractors', label: 'Kontrahenci' },
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  if (href === '/documents') {
    return (
      pathname === '/documents' ||
      (pathname.startsWith('/documents/') &&
        !pathname.startsWith('/documents/new') &&
        !pathname.startsWith('/documents/upload'))
    )
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLinks({
  links,
  pathname,
}: {
  links: Array<{ href: string; label: string }>
  pathname: string
}) {
  return (
    <>
      {links.map((link) => {
        const active = isActive(pathname, link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'shrink-0 rounded-md px-2.5 py-1.5 text-sm transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </>
  )
}

export function AppNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-5xl items-center gap-3 px-4">
        <Link href="/" className="shrink-0 text-sm font-semibold tracking-tight text-foreground">
          Gumijagoda
        </Link>
        <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavLinks links={primary} pathname={pathname} />
          <span className="mx-1 h-4 w-px shrink-0 bg-border" aria-hidden />
          <NavLinks links={settings} pathname={pathname} />
        </nav>
      </div>
    </header>
  )
}
