export function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

const OMIT_FROM_PAGE_LINKS = new Set([
  'error',
  'accepted',
  'uploaded',
  'saved',
  'created',
  'deleted',
  'ran',
  'imported',
  'duplicates',
  'found',
  'importError',
  'page',
])

export function hrefWithPage(
  pathname: string,
  params: Record<string, string | string[] | undefined>,
  page: number,
) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (OMIT_FROM_PAGE_LINKS.has(key)) continue
    const next = first(value)
    if (next) search.set(key, next)
  }
  if (page > 1) search.set('page', String(page))
  const query = search.toString()
  return query ? `${pathname}?${query}` : pathname
}

