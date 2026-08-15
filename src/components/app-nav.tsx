'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { logoutAction } from '@/server/auth/actions'
import { APP_NAME, COMPANY_CONTEXT_LABEL, COMPANY_SHORT } from '@/lib/brand'
import { cn } from '@/lib/utils'

const primary = [
  { href: '/buffer', label: 'Bufor' },
  { href: '/documents', label: 'Rejestr' },
  { href: '/documents/new', label: 'Ręczny' },
  { href: '/documents/upload', label: 'Wgraj' },
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
              'shrink-0 cursor-pointer rounded-md px-2.5 py-1.5 text-sm transition-colors',
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

export function AppNav({ showLogout = false }: { showLogout?: boolean }) {
  const pathname = usePathname()

  if (pathname === '/login') return null

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-5xl items-center gap-3 px-4">
        <Link href="/" className="shrink-0 cursor-pointer text-sm font-semibold tracking-tight text-foreground">
          {APP_NAME}
        </Link>
        <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavLinks links={primary} pathname={pathname} />
          <span className="mx-1 h-4 w-px shrink-0 bg-border" aria-hidden />
          <NavLinks links={settings} pathname={pathname} />
        </nav>
        <div className="hidden shrink-0 text-right leading-tight sm:block">
          <p className="text-[11px] text-muted-foreground">{COMPANY_CONTEXT_LABEL}</p>
          <p className="text-sm font-medium text-foreground">{COMPANY_SHORT}</p>
        </div>
        {showLogout ? (
          <form action={logoutAction}>
            <button
              type="submit"
              className="shrink-0 cursor-pointer rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Wyloguj
            </button>
          </form>
        ) : null}
      </div>
    </header>
  )
}
