import Link from 'next/link'
import { notFound } from 'next/navigation'

import { FaInvoiceView } from '@/components/fa-invoice-view'
import { PdfPreviewFrame } from '@/components/pdf-preview-frame'
import {
  Alert,
  PageShell,
  buttonSecondaryClassName,
  tableClassName,
  tdClassName,
  thClassName,
} from '@/components/ui-kit'
import { DocumentError } from '@/server/documents/errors'
import { getDocumentPreview } from '@/server/documents/get-document-preview'
import type { ParsedFaInvoice } from '@/server/documents/parse-fa-xml'

type RouteParams = Promise<{ id: string }>

function documentAsInvoiceView(document: {
  number: string
  issueDate: string
  dueDate: string | null
  netAmount: string
  vatAmount: string
  grossAmount: string
  currency: string
  paymentAccount: string | null
  contractor: { name: string; nip: string | null }
  type: { direction: string }
}): ParsedFaInvoice {
  const party = {
    name: document.contractor.name,
    ...(document.contractor.nip ? { nip: document.contractor.nip } : {}),
  }
  const isPayable = document.type.direction === 'PAYABLE'

  return {
    number: document.number,
    issueDate: document.issueDate,
    ...(document.dueDate ? { dueDate: document.dueDate } : {}),
    netAmount: document.netAmount,
    vatAmount: document.vatAmount,
    grossAmount: document.grossAmount,
    currency: document.currency,
    ...(document.paymentAccount ? { paymentAccount: document.paymentAccount } : {}),
    seller: isPayable ? party : { name: 'Gumijagoda Sp. z o.o.' },
    buyer: isPayable ? { name: 'Gumijagoda Sp. z o.o.' } : party,
    lines: [],
  }
}

export default async function DocumentPreviewPage({ params }: { params: RouteParams }) {
  const { id } = await params

  let preview
  try {
    preview = await getDocumentPreview(id)
  } catch (error) {
    if (error instanceof DocumentError && error.status === 404) notFound()
    throw error
  }

  const { document, attachments, xmlInvoice, xmlParseFailed, pdfAttachmentId, xmlAttachmentId } =
    preview
  const backHref = document.stage === 'BUFFER' ? '/buffer' : '/documents'
  const pdfMeta = attachments.find((item) => item.id === pdfAttachmentId)
  const xmlMeta = attachments.find((item) => item.id === xmlAttachmentId)
  const structured = xmlInvoice ?? documentAsInvoiceView(document)

  return (
    <PageShell
      wide
      title={`Podgląd: ${document.number}`}
      description={`${document.stage} · ${document.source}${
        structured.formVariant ? ` · ${structured.formVariant}` : ''
      }`}
    >
      <div className="flex flex-wrap gap-2">
        <Link href={backHref} className={buttonSecondaryClassName}>
          ← Wróć do listy
        </Link>
        <Link href={`/documents/${document.id}`} className={buttonSecondaryClassName}>
          Szczegóły / edycja
        </Link>
      </div>

      {!pdfAttachmentId && !xmlAttachmentId ? (
        <Alert tone="ok">
          Brak pliku źródłowego — pokazuję dane zapisane w dokumencie (typowe dla wpisu ręcznego).
        </Alert>
      ) : null}

      {xmlParseFailed ? (
        <Alert>
          Nie udało się odczytać XML załącznika — pokazuję dane zapisane w dokumencie. Plik nadal
          możesz pobrać poniżej.
        </Alert>
      ) : null}

      {pdfAttachmentId && pdfMeta ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-900">PDF</h2>
          <PdfPreviewFrame
            src={`/api/documents/${document.id}/attachments/${pdfAttachmentId}`}
            filename={pdfMeta.filename}
          />
        </section>
      ) : null}

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900">
            {xmlInvoice ? 'Dane z XML KSeF' : 'Dane dokumentu'}
          </h2>
          {xmlAttachmentId && xmlMeta ? (
            <a
              href={`/api/documents/${document.id}/attachments/${xmlAttachmentId}?download=1`}
              className="text-sm text-zinc-600 underline"
            >
              Pobierz XML ({xmlMeta.filename})
            </a>
          ) : null}
        </div>
        <FaInvoiceView invoice={structured} />
      </section>

      {attachments.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-900">Załączniki</h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className={tableClassName}>
              <thead>
                <tr>
                  <th className={thClassName}>Plik</th>
                  <th className={thClassName}>Rodzaj</th>
                  <th className={thClassName}>MIME</th>
                  <th className={thClassName}>Rozmiar</th>
                  <th className={thClassName}></th>
                </tr>
              </thead>
              <tbody>
                {attachments.map((attachment) => (
                  <tr key={attachment.id}>
                    <td className={tdClassName}>{attachment.filename}</td>
                    <td className={tdClassName}>{attachment.kind}</td>
                    <td className={tdClassName}>{attachment.mimeType}</td>
                    <td className={tdClassName}>{attachment.sizeBytes} B</td>
                    <td className={tdClassName}>
                      <a
                        href={`/api/documents/${document.id}/attachments/${attachment.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        Otwórz
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </PageShell>
  )
}
