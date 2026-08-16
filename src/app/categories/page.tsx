import { CategoryTree } from '@/components/category-tree'
import { ConfirmDelete } from '@/components/confirm-delete'
import { PageShell } from '@/components/page-shell'
import {
  Card,
  CardTitle,
  Field,
  buttonClassName,
  buttonSecondaryClassName,
  controlClassName,
} from '@/components/ui-kit'
import {
  createCategoryAction,
  createKeywordRuleAction,
  deleteKeywordRuleAction,
  updateKeywordRuleAction,
} from '@/server/categories/actions'
import { listCategoryOptions, listCategoryTree } from '@/server/categories/list-categories'
import { listKeywordRules } from '@/server/categories/list-keyword-rules'

export default async function CategoriesPage() {
  const tree = await listCategoryTree()
  const options = await listCategoryOptions()
  const keywordRules = await listKeywordRules()

  return (
    <PageShell
      title="Kategorie kosztów"
      description="Drzewo kategorii oraz reguły ze słów kluczowych. Kontrahent → kategoria ma pierwszeństwo (strona Kontrahenci)."
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
        <CategoryTree nodes={tree} />
      </Card>
    </PageShell>
  )
}
