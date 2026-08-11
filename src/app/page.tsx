import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ padding: '1rem' }}>
      <h1>Gumijagoda — zarządzanie fakturami</h1>
      <ul>
        <li>
          <Link href="/documents">Rejestr dokumentów</Link>
        </li>
        <li>
          <Link href="/buffer">Bufor</Link>
        </li>
        <li>
          <Link href="/documents/new">Nowy dokument</Link>
        </li>
        <li>
          <Link href="/api/health">Health</Link>
        </li>
      </ul>
    </main>
  )
}
