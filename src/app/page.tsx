import Link from 'next/link'

import { PageShell, buttonSecondaryClassName } from '@/components/ui-kit'

const links = [
  { href: '/documents', label: 'Rejestr', hint: 'zaakceptowane dokumenty' },
  { href: '/buffer', label: 'Bufor', hint: 'oczekujące na akceptację' },
  { href: '/documents/upload', label: 'Upload PDF/XML', hint: 'wgraj do bufora' },
  { href: '/ksef/import', label: 'Pobierz z KSeF', hint: 'import do bufora' },
  { href: '/ksef/schedule', label: 'Harmonogram KSeF', hint: 'wiele godzin na dobę' },
  { href: '/document-types', label: 'Typy dokumentów', hint: 'własne typy, kierunek' },
  { href: '/categories', label: 'Kategorie', hint: 'drzewo kosztów' },
  { href: '/contractors', label: 'Kontrahenci', hint: 'reguła kategorii' },
  { href: '/documents/new', label: 'Nowy dokument', hint: 'ręczne dodanie' },
]

export default function Home() {
  return (
    <PageShell
      title="Gumijagoda"
      description="Minimalny panel do testowania ścieżek: upload / KSeF → bufor → rejestr → kategorie."
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-400"
          >
            <div className="text-sm font-medium text-zinc-900">{link.label}</div>
            <div className="text-xs text-zinc-500">{link.hint}</div>
          </Link>
        ))}
      </div>
      <p>
        <Link href="/api/health" className={buttonSecondaryClassName}>
          Health check
        </Link>
      </p>
      <p className="text-xs text-zinc-500">
        Fixture’y XML: <code className="rounded bg-zinc-100 px-1">fixtures/ksef/</code>
      </p>
    </PageShell>
  )
}
