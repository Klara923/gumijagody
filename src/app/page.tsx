import Link from 'next/link'

const scope = [
  {
    title: 'Rejestr dokumentów',
    description:
      'Ewidencja faktur z filtrowaniem, sortowaniem, konfigurowalnymi kolumnami i danymi kontrahenta.',
  },
  {
    title: 'Pobieranie z KSeF i upload',
    description:
      'Import do bufora, wgrywanie plików spoza KSeF, harmonogram i akceptacja przenosząca do rejestru.',
  },
  {
    title: 'Kategoryzacja',
    description: 'Drzewo kategorii kosztów, ręczne przypisanie i reguła kontrahent → kategoria.',
  },
  {
    title: 'Podgląd dokumentów',
    description:
      'Renderowanie PDF oraz czytelna prezentacja danych z XML KSeF w schemacie FA(2)/FA(3).',
  },
]

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-6 py-16">
      <header className="space-y-3">
        <p className="text-muted-foreground text-sm font-medium">Gumijagoda Sp. z o.o.</p>
        <h1 className="text-4xl font-semibold tracking-tight">System zarządzania fakturami</h1>
        <p className="text-muted-foreground text-lg">
          Ewidencja faktur kosztowych i sprzedażowych z integracją ze środowiskiem testowym KSeF.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {scope.map((area) => (
          <li key={area.title} className="border-border rounded-lg border p-4">
            <h2 className="font-medium">{area.title}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{area.description}</p>
          </li>
        ))}
      </ul>

      <footer className="text-muted-foreground text-sm">
        Stan usług:{' '}
        <Link href="/api/health" className="underline underline-offset-4">
          /api/health
        </Link>
      </footer>
    </main>
  )
}
