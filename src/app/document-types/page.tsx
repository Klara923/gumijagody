import { ConfirmDelete } from '@/components/confirm-delete'
import {
  Card,
  CardTitle,
  EnumBadge,
  Field,
  PageShell,
  buttonClassName,
  controlClassName,
  tableClassName,
  tdClassName,
  thClassName,
  trClassName,
} from '@/components/ui-kit'
import { DOCUMENT_DIRECTION } from '@/lib/labels'
import { first } from '@/lib/search-params'
import {
  createDocumentTypeAction,
  deleteDocumentTypeAction,
  updateDocumentTypeAction,
} from '@/server/document-types/actions'
import { listDocumentTypes } from '@/server/document-types/list-document-types'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function DocumentTypesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const error = first(params.error)
  const created = first(params.created)
  const saved = first(params.saved)
  const deleted = first(params.deleted)
  const types = await listDocumentTypes()

  return (
    <PageShell
      title="Typy dokumentów"
      description="Typ systemowy ma kierunek należność albo zobowiązanie. Własne typy (nota obciążeniowa, odsetkowa, karna) dodajesz tutaj i wybierasz na dokumencie."
      flash={
        error
          ? { message: error }
          : created
            ? { tone: 'ok', message: 'Dodano typ.' }
            : saved
              ? { tone: 'ok', message: 'Zapisano typ.' }
              : deleted
                ? { tone: 'ok', message: 'Usunięto typ.' }
                : null
      }
    >

      <Card>
        <CardTitle>Dodaj własny typ</CardTitle>
        <form action={createDocumentTypeAction} className="grid max-w-md gap-3">
          <Field label="Nazwa">
            <input name="name" required placeholder="Nota obciążeniowa" className={controlClassName} />
          </Field>
          <Field label="Kierunek">
            <select name="direction" required defaultValue="PAYABLE" className={controlClassName}>
              <option value="PAYABLE">Zobowiązanie (do zapłaty)</option>
              <option value="RECEIVABLE">Należność (do otrzymania)</option>
            </select>
          </Field>
          <button type="submit" className={buttonClassName}>
            Dodaj
          </button>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className={tableClassName}>
          <thead>
            <tr>
              <th className={thClassName}>Nazwa</th>
              <th className={thClassName}>Kierunek</th>
              <th className={thClassName}>Dokumenty</th>
              <th className={thClassName} />
            </tr>
          </thead>
          <tbody>
            {types.map((type) => (
              <tr key={type.id} className={trClassName}>
                <td className={tdClassName}>
                  {type.isSystem ? (
                    type.name
                  ) : (
                    <form action={updateDocumentTypeAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={type.id} />
                      <input name="name" defaultValue={type.name} required className={controlClassName} />
                      <select
                        name="direction"
                        defaultValue={type.direction}
                        className={controlClassName}
                      >
                        <option value="PAYABLE">Zobowiązanie</option>
                        <option value="RECEIVABLE">Należność</option>
                      </select>
                      <button type="submit" className={buttonClassName}>
                        Zapisz
                      </button>
                    </form>
                  )}
                </td>
                <td className={tdClassName}>
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <EnumBadge value={type.direction} labels={DOCUMENT_DIRECTION} />
                    {type.isSystem ? (
                      <span className="text-xs text-muted-foreground">systemowy</span>
                    ) : null}
                  </span>
                </td>
                <td className={tdClassName}>{type.documentsCount}</td>
                <td className={tdClassName}>
                  {type.isSystem ? (
                    <span className="text-xs text-muted-foreground">Nie usuwa się</span>
                  ) : (
                    <ConfirmDelete
                      action={deleteDocumentTypeAction}
                      fields={{ id: type.id }}
                      title={`Usunąć typ „${type.name}”?`}
                      description="Typu używanego przez dokumenty nie da się usunąć."
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PageShell>
  )
}
