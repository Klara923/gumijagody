import {
  Alert,
  Field,
  PageShell,
  buttonClassName,
  buttonSecondaryClassName,
  controlClassName,
} from '@/components/ui-kit'
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from '@/server/categories/actions'
import { listCategoryOptions, listCategoryTree } from '@/server/categories/list-categories'
import type { CategoryNode } from '@/server/categories/list-categories'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function CategoryBranch({ nodes, depth = 0 }: { nodes: CategoryNode[]; depth?: number }) {
  return (
    <ul className={depth === 0 ? 'space-y-3' : 'mt-2 space-y-2 border-l border-zinc-200 pl-4'}>
      {nodes.map((node) => (
        <li key={node.id} className="rounded-md bg-zinc-50/80 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm text-zinc-900">{node.name}</strong>
            <form action={updateCategoryAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={node.id} />
              <input name="name" defaultValue={node.name} required className={controlClassName} />
              <button type="submit" className={buttonSecondaryClassName}>
                Zmień nazwę
              </button>
            </form>
            <form action={deleteCategoryAction}>
              <input type="hidden" name="id" value={node.id} />
              <button type="submit" className={buttonSecondaryClassName}>
                Usuń
              </button>
            </form>
          </div>
          {node.children.length > 0 && <CategoryBranch nodes={node.children} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  )
}

export default async function CategoriesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const error = first(params.error)
  const created = first(params.created)
  const saved = first(params.saved)
  const deleted = first(params.deleted)
  const tree = await listCategoryTree()
  const options = await listCategoryOptions()

  return (
    <PageShell
      title="Kategorie kosztów"
      description="Dodaj kategorię główną albo podkategorię (wybierz nadrzędną)."
    >
      {error && <Alert>{error}</Alert>}
      {created && <Alert tone="ok">Dodano kategorię.</Alert>}
      {saved && <Alert tone="ok">Zapisano kategorię.</Alert>}
      {deleted && <Alert tone="ok">Usunięto kategorię.</Alert>}

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Dodaj kategorię</h2>
        <form action={createCategoryAction} className="grid max-w-md gap-3">
          <Field label="Nazwa">
            <input name="name" required className={controlClassName} />
          </Field>
          <Field label="Kategoria nadrzędna">
            <select name="parentId" defaultValue="" className={controlClassName}>
              <option value="">— brak (poziom główny) —</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <button type="submit" className={buttonClassName}>
            Dodaj
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Drzewo</h2>
        {tree.length === 0 ? (
          <p className="text-sm text-zinc-600">Brak kategorii.</p>
        ) : (
          <CategoryBranch nodes={tree} />
        )}
      </section>
    </PageShell>
  )
}
