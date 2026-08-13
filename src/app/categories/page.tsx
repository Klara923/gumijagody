import { ConfirmDelete } from '@/components/confirm-delete'
import {
  Card,
  CardTitle,
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
    <ul className={depth === 0 ? 'space-y-3' : 'mt-2 space-y-2 border-l border-border pl-4'}>
      {nodes.map((node) => (
        <li key={node.id} className="rounded-md bg-muted/60 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm text-foreground">{node.name}</strong>
            <form action={updateCategoryAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={node.id} />
              <input name="name" defaultValue={node.name} required className={controlClassName} />
              <button type="submit" className={buttonSecondaryClassName}>
                Zmień nazwę
              </button>
            </form>
            <ConfirmDelete
              action={deleteCategoryAction}
              fields={{ id: node.id }}
              title={`Usunąć kategorię „${node.name}”?`}
              description="Nie usuniesz kategorii, która ma podkategorie albo przypisane dokumenty."
            />
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
      flash={
        error
          ? { message: error }
          : created
            ? { tone: 'ok', message: 'Dodano kategorię.' }
            : saved
              ? { tone: 'ok', message: 'Zapisano kategorię.' }
              : deleted
                ? { tone: 'ok', message: 'Usunięto kategorię.' }
                : ruleCreated
                  ? { tone: 'ok', message: 'Dodano regułę słowa kluczowego.' }
                  : ruleSaved
                    ? { tone: 'ok', message: 'Zapisano regułę.' }
                    : ruleDeleted
                      ? { tone: 'ok', message: 'Usunięto regułę.' }
                      : null
      }
    >

      <Card>
        <CardTitle>Dodaj kategorię</CardTitle>
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
      </Card>

      <Card>
        <CardTitle>Reguły ze słów kluczowych</CardTitle>
        <p className="mb-3 text-sm text-muted-foreground">
          Jeśli kontrahent nie ma domyślnej kategorii, dokument dostanie kategorię z pierwszej
          pasującej reguły. Szukamy słowa w nazwie kontrahenta, NIP, numerze dokumentu i pozycjach
          faktury XML. Mniejsza kolejność wygrywa; przy remisie dłuższe słowo.
        </p>
        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground">Najpierw dodaj kategorię powyżej.</p>
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
                className="flex flex-col gap-2 rounded-md bg-muted/60 p-3 sm:flex-row sm:flex-wrap sm:items-center"
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
                <ConfirmDelete
                  action={deleteKeywordRuleAction}
                  fields={{ id: rule.id }}
                  title={`Usunąć regułę „${rule.keyword}”?`}
                  description="Nowe dokumenty przestaną dostawać tę kategorię po tym słowie."
                />
              </li>
            ))}
          </ul>
        ) : options.length > 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Brak reguł słów kluczowych.</p>
        ) : null}
      </Card>

      <Card>
        <CardTitle>Drzewo</CardTitle>
        {tree.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak kategorii.</p>
        ) : (
          <CategoryBranch nodes={tree} />
        )}
      </Card>
    </PageShell>
  )
}
