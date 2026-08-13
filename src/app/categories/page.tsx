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
  createKeywordRuleAction,
  deleteCategoryAction,
  deleteKeywordRuleAction,
  updateCategoryAction,
  updateKeywordRuleAction,
} from '@/server/categories/actions'
import { listCategoryOptions, listCategoryTree } from '@/server/categories/list-categories'
import type { CategoryNode } from '@/server/categories/list-categories'
import { listKeywordRules } from '@/server/categories/list-keyword-rules'

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
  const ruleCreated = first(params.ruleCreated)
  const ruleSaved = first(params.ruleSaved)
  const ruleDeleted = first(params.ruleDeleted)
  const tree = await listCategoryTree()
  const options = await listCategoryOptions()
  const keywordRules = await listKeywordRules()

  return (
    <PageShell
      title="Kategorie kosztów"
      description="Drzewo kategorii oraz reguły ze słów kluczowych. Kontrahent → kategoria ma pierwszeństwo (strona Kontrahenci)."
    >
      {error && <Alert>{error}</Alert>}
      {created && <Alert tone="ok">Dodano kategorię.</Alert>}
      {saved && <Alert tone="ok">Zapisano kategorię.</Alert>}
      {deleted && <Alert tone="ok">Usunięto kategorię.</Alert>}
      {ruleCreated && <Alert tone="ok">Dodano regułę słowa kluczowego.</Alert>}
      {ruleSaved && <Alert tone="ok">Zapisano regułę.</Alert>}
      {ruleDeleted && <Alert tone="ok">Usunięto regułę.</Alert>}

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
        <h2 className="mb-1 text-sm font-semibold text-zinc-900">Reguły ze słów kluczowych</h2>
        <p className="mb-3 text-sm text-zinc-600">
          Jeśli kontrahent nie ma domyślnej kategorii, dokument dostanie kategorię z pierwszej
          pasującej reguły. Szukamy słowa w nazwie kontrahenta, NIP, numerze dokumentu i pozycjach
          faktury XML. Mniejsza kolejność wygrywa; przy remisie dłuższe słowo.
        </p>
        {options.length === 0 ? (
          <p className="text-sm text-zinc-600">Najpierw dodaj kategorię powyżej.</p>
        ) : (
          <form action={createKeywordRuleAction} className="grid max-w-md gap-3">
            <Field label="Słowo kluczowe">
              <input
                name="keyword"
                required
                minLength={2}
                placeholder="transport"
                className={controlClassName}
              />
            </Field>
            <Field label="Kategoria">
              <select name="categoryId" required defaultValue="" className={controlClassName}>
                <option value="">Wybierz…</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Kolejność (mniejsza = ważniejsza)">
              <input
                name="priority"
                type="number"
                min={0}
                max={9999}
                defaultValue={100}
                className={controlClassName}
              />
            </Field>
            <button type="submit" className={buttonClassName}>
              Dodaj regułę
            </button>
          </form>
        )}

        {keywordRules.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {keywordRules.map((rule) => (
              <li
                key={rule.id}
                className="flex flex-col gap-2 rounded-md bg-zinc-50/80 p-3 sm:flex-row sm:flex-wrap sm:items-center"
              >
                <form action={updateKeywordRuleAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={rule.id} />
                  <input
                    name="keyword"
                    defaultValue={rule.keyword}
                    required
                    minLength={2}
                    className={controlClassName}
                  />
                  <select
                    name="categoryId"
                    defaultValue={rule.category.id}
                    className={controlClassName}
                  >
                    {options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    name="priority"
                    type="number"
                    min={0}
                    max={9999}
                    defaultValue={rule.priority}
                    className={controlClassName}
                  />
                  <button type="submit" className={buttonSecondaryClassName}>
                    Zapisz
                  </button>
                </form>
                <form action={deleteKeywordRuleAction}>
                  <input type="hidden" name="id" value={rule.id} />
                  <button type="submit" className={buttonSecondaryClassName}>
                    Usuń
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : options.length > 0 ? (
          <p className="mt-3 text-sm text-zinc-600">Brak reguł słów kluczowych.</p>
        ) : null}
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
