import Link from 'next/link'

import { Card, PageShell, buttonClassName, buttonSecondaryClassName } from '@/components/ui-kit'

const flow = [
  {
    step: '1',
    href: '/documents/upload',
    label: 'Wgraj albo pobierz',
    hint: 'PDF, XML FA albo import z KSeF trafia do bufora.',
    extra: { href: '/ksef/import', label: 'Pobierz z KSeF' },
  },
  {
    step: '2',
    href: '/buffer',
    label: 'Akceptuj w buforze',
    hint: 'Przejrzyj pozycje i przenieś wybrane do rejestru.',
  },
  {
    step: '3',
    href: '/documents',
    label: 'Przeglądaj rejestr',
    hint: 'Filtry, kolumny i podgląd faktury bez pobierania pliku.',
  },
]

const settings = [
  { href: '/categories', label: 'Kategorie', hint: 'drzewo i słowa kluczowe' },
  { href: '/contractors', label: 'Kontrahenci', hint: 'domyślna kategoria' },
  { href: '/document-types', label: 'Typy', hint: 'należność / zobowiązanie' },
  { href: '/ksef/schedule', label: 'Harmonogram', hint: 'automatyczne pobieranie' },
]

export default function Home() {
  return (
    <PageShell
      title="Gumijagoda"
      description="Ewidencja faktur: KSeF i upload najpierw do bufora, po akceptacji do rejestru. Kategoria z reguły kontrahenta albo słowa kluczowego."
      actions={
        <Link href="/documents/new" className={buttonClassName}>
          Nowy dokument
        </Link>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        {flow.map((item) => (
          <Card key={item.step} className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground">Krok {item.step}</p>
            <div>
              <Link href={item.href} className="text-sm font-semibold text-foreground hover:underline">
                {item.label}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">{item.hint}</p>
            </div>
            <div className="mt-auto flex flex-wrap gap-2">
              <Link href={item.href} className={buttonClassName}>
                Otwórz
              </Link>
              {item.extra ? (
                <Link href={item.extra.href} className={buttonSecondaryClassName}>
                  {item.extra.label}
                </Link>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {settings.map((link) => (
          <Link key={link.href} href={link.href} className="group">
            <Card className="h-full transition-colors group-hover:border-foreground/20">
              <div className="text-sm font-medium text-foreground">{link.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{link.hint}</div>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}
