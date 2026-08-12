import type { ParsedFaInvoice, ParsedFaParty } from '@/server/documents/parse-fa-xml'
import {
  tableClassName,
  tdClassName,
  thClassName,
} from '@/components/ui-kit'

function PartyCard({ title, party }: { title: string; party: ParsedFaParty }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
      <h3 className="mb-2 font-semibold text-zinc-900">{title}</h3>
      <p className="font-medium text-zinc-800">{party.name}</p>
      {party.nip ? <p className="text-zinc-600">NIP: {party.nip}</p> : null}
      {party.address ? <p className="text-zinc-600">{party.address}</p> : null}
    </div>
  )
}

export function FaInvoiceView({ invoice }: { invoice: ParsedFaInvoice }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-zinc-900">{invoice.number}</h2>
          {invoice.formVariant ? (
            <span className="text-xs text-zinc-500">{invoice.formVariant}</span>
          ) : null}
        </div>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Data wystawienia</dt>
            <dd className="font-medium text-zinc-900">{invoice.issueDate}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Termin płatności</dt>
            <dd className="font-medium text-zinc-900">{invoice.dueDate ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Netto / VAT / Brutto</dt>
            <dd className="font-medium text-zinc-900">
              {invoice.netAmount} / {invoice.vatAmount} / {invoice.grossAmount} {invoice.currency}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Rachunek</dt>
            <dd className="font-medium text-zinc-900">{invoice.paymentAccount ?? '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PartyCard title="Sprzedawca" party={invoice.seller} />
        <PartyCard title="Nabywca" party={invoice.buyer} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className={tableClassName}>
          <thead>
            <tr>
              <th className={thClassName}>Lp.</th>
              <th className={thClassName}>Nazwa</th>
              <th className={thClassName}>Ilość</th>
              <th className={thClassName}>Jm</th>
              <th className={thClassName}>Cena netto</th>
              <th className={thClassName}>Netto</th>
              <th className={thClassName}>VAT %</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.length === 0 ? (
              <tr>
                <td className={tdClassName} colSpan={7}>
                  Brak pozycji.
                </td>
              </tr>
            ) : (
              invoice.lines.map((line) => (
                <tr key={`${line.lineNumber}-${line.name}`}>
                  <td className={tdClassName}>{line.lineNumber || '—'}</td>
                  <td className={tdClassName}>{line.name}</td>
                  <td className={tdClassName}>{line.quantity ?? '—'}</td>
                  <td className={tdClassName}>{line.unit ?? '—'}</td>
                  <td className={tdClassName}>{line.unitNetPrice ?? '—'}</td>
                  <td className={tdClassName}>{line.netAmount ?? '—'}</td>
                  <td className={tdClassName}>{line.vatRate ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
