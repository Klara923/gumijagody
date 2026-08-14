import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DocumentPreviewBody } from '@/components/document-preview-body'
import { EnumBadge, PageShell, buttonSecondaryClassName } from '@/components/ui-kit'
import { DOCUMENT_SOURCE, DOCUMENT_STAGE } from '@/lib/labels'
import { DocumentError } from '@/server/documents/errors'
import { getDocumentPreview } from '@/server/documents/get-document-preview'

type RouteParams = Promise<{ id: string }>

export default async function DocumentPreviewPage({ params }: { params: RouteParams }) {
  const { id } = await params

  let preview
  try {
    preview = await getDocumentPreview(id)
  } catch (error) {
    if (error instanceof DocumentError && error.status === 404) notFound()
    throw error
  }

  const { document } = preview
  const backHref = document.stage === 'BUFFER' ? '/buffer' : '/documents'

  return (
    <PageShell
      title={`Podgląd: ${document.number}`}
      description={
        preview.xmlInvoice?.formVariant
          ? `Schemat ${preview.xmlInvoice.formVariant}`
          : undefined
      }
      meta={
        <div className="flex flex-wrap gap-2 pt-1">
          <EnumBadge value={document.stage} labels={DOCUMENT_STAGE} />
          <EnumBadge value={document.source} labels={DOCUMENT_SOURCE} />
        </div>
      }
      actions={
        <>
          <Link href={backHref} className={buttonSecondaryClassName}>
            Wróć do listy
          </Link>
          <Link href={`/documents/${document.id}`} className={buttonSecondaryClassName}>
            Szczegóły
          </Link>
        </>
      }
    >
      <DocumentPreviewBody preview={preview} />
    </PageShell>
  )
}
