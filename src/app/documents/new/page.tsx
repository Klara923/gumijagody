import { createDocumentAction } from '@/server/documents/actions'
import { getPrisma } from '@/server/infrastructure/db/prisma'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function NewDocumentPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const error = first(params.error)
  const types = await getPrisma().documentType.findMany({ orderBy: { name: 'asc' } })

  return (
    <main style={{ padding: '1rem', maxWidth: 560 }}>
      <h1>Nowy dokument</h1>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <form action={createDocumentAction} style={{ display: 'grid', gap: '0.75rem' }}>
        <label>
          Numer
          <input name="number" required style={{ display: 'block', width: '100%' }} />
        </label>
        <label>
          Typ
          <select name="typeId" required style={{ display: 'block', width: '100%' }}>
            <option value="">Wybierz…</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Kontrahent — nazwa
          <input name="contractorName" required style={{ display: 'block', width: '100%' }} />
        </label>
        <label>
          Kontrahent — NIP (opcjonalnie)
          <input name="contractorNip" style={{ display: 'block', width: '100%' }} />
        </label>
        <label>
          Data wystawienia
          <input type="date" name="issueDate" required style={{ display: 'block', width: '100%' }} />
        </label>
        <label>
          Termin płatności
          <input type="date" name="dueDate" style={{ display: 'block', width: '100%' }} />
        </label>
        <label>
          Netto
          <input name="netAmount" required placeholder="100.00" style={{ display: 'block', width: '100%' }} />
        </label>
        <label>
          VAT
          <input name="vatAmount" required placeholder="23.00" style={{ display: 'block', width: '100%' }} />
        </label>
        <label>
          Brutto
          <input
            name="grossAmount"
            required
            placeholder="123.00"
            style={{ display: 'block', width: '100%' }}
          />
        </label>
        <label>
          Waluta
          <input name="currency" defaultValue="PLN" style={{ display: 'block', width: '100%' }} />
        </label>
        <button type="submit">Zapisz</button>
      </form>
    </main>
  )
}
