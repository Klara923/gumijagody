import Link from 'next/link'

import { Card, PageShell, buttonSecondaryClassName } from '@/components/ui-kit'

const links = [
  { href: '/documents', label: 'Rejestr', hint: 'zaakceptowane dokumenty' },
  { href: '/buffer', label: 'Bufor', hint: 'oczekujące na akceptację' },
  { href: '/documents/upload', label: 'Upload PDF/XML', hint: 'wgraj do bufora' },
  { href: '/ksef/import', label: 'Pobierz z KSeF', hint: 'import do bufora' },
  { href: '/ksef/schedule', label: 'Harmonogram KSeF', hint: 'wiele godzin na dobę' },
  { href: '/document-types', label: 'Typy dokumentów', hint: 'własne typy, kierunek' },
  { href: '/categories', label: 'Kategorie', hint: 'drzewo i słowa kluczowe' },
  { href: '/contractors', label: 'Kontrahenci', hint: 'reguła kategorii' },
  { href: '/documents/new', label: 'Nowy dokument', hint: 'ręczne dodanie' },
]

export default function Home() {
  return (
    <PageShell
      title="Gumijagoda"
      description="Ewidencja faktur: pobieranie z KSeF i upload trafiają do bufora, po akceptacji do rejestru. Kategoria z reguły kontrahenta albo słowa kluczowego."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="group">
            <Card className="h-full transition-colors group-hover:border-foreground/20">
              <div className="text-sm font-medium text-foreground">{link.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{link.hint}</div>
            </Card>
          </Link>
        ))}
      </div>
      <p>
        <Link href="/api/health" className={buttonSecondaryClassName}>
          Health check
        </Link>
      </p>
    </PageShell>
  )
}
