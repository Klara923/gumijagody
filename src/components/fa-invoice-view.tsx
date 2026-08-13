import type { ParsedFaInvoice, ParsedFaParty } from '@/server/documents/parse-fa-xml'
import {
  Card,
  tableClassName,
  tdClassName,
  thClassName,
  trClassName,
} from '@/components/ui-kit'

function PartyCard({ title, party }: { title: string; party: ParsedFaParty }) {
  return (
    <Card className="text-sm">
      <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
      <p className="font-medium text-foreground">{party.name}</p>
      {party.nip ? <p className="text-muted-foreground">NIP: {party.nip}</p> : null}
      {party.address ? <p className="text-muted-foreground">{party.address}</p> : null}
    </Card>
  )
}

export function FaInvoiceView({ invoice }: { invoice: ParsedFaInvoice }) {
  return (
    <div className="space-y-4">
      <Card className="text-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">{invoice.number}</h2>
          {invoice.formVariant ? (
            <span className="text-xs text-muted-foreground">{invoice.formVariant}</span>
          ) : null}
        </div>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Data wystawienia</dt>
            <dd className="font-medium text-foreground">{invoice.issueDate}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Termin płatności</dt>
            <dd className="font-medium text-foreground">{invoice.dueDate ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Netto / VAT / Brutto</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {invoice.netAmount} / {invoice.vatAmount} / {invoice.grossAmount} {invoice.currency}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Rachunek</dt>
            <dd className="font-medium text-foreground">{invoice.paymentAccount ?? '—'}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <PartyCard title="Sprzedawca" party={invoice.seller} />
        <PartyCard title="Nabywca" party={invoice.buyer} />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className={tableClassName}>
          <thead>
            <tr>
              <th className={`${thClassName} w-14`}>Lp.</th>
              <th className={thClassName}>Nazwa</th>
              <th className={thClassName}>Ilość</th>
              <th className={thClassName}>Jm</th>
              <th className={thClassName}>Cena netto</th>
              <th className={thClassName}>Netto</th>
              <th className={`${thClassName} w-20`}>VAT %</th>
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
                <tr key={`${line.lineNumber}-${line.name}`} className={trClassName}>
                  <td className={tdClassName}>{line.lineNumber || '—'}</td>
                  <td className={`${tdClassName} truncate`}>{line.name}</td>
                  <td className={`${tdClassName} tabular-nums`}>{line.quantity ?? '—'}</td>
                  <td className={tdClassName}>{line.unit ?? '—'}</td>
                  <td className={`${tdClassName} tabular-nums`}>{line.unitNetPrice ?? '—'}</td>
                  <td className={`${tdClassName} tabular-nums`}>{line.netAmount ?? '—'}</td>
                  <td className={`${tdClassName} tabular-nums`}>{line.vatRate ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
