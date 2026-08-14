import Link from 'next/link'

import { buttonSecondaryClassName } from '@/components/ui-kit'
import { hrefWithPage } from '@/lib/search-params'

export function ListPagination({
  pathname,
  searchParams,
  page,
  pageSize,
  hasMore,
}: {
  pathname: string
  searchParams: Record<string, string | string[] | undefined>
  page: number
  pageSize: number
  hasMore: boolean
}) {
  if (page <= 1 && !hasMore) return null

  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="Paginacja">
      {page > 1 ? (
        <Link
          href={hrefWithPage(pathname, searchParams, page - 1)}
          className={buttonSecondaryClassName}
        >
          Poprzednia strona
        </Link>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Strona {page} · {pageSize} na stronę
      </p>
      {hasMore ? (
        <Link
          href={hrefWithPage(pathname, searchParams, page + 1)}
          className={buttonSecondaryClassName}
        >
          Następna strona
        </Link>
      ) : null}
    </nav>
  )
}
