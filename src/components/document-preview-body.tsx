import { FaInvoiceView } from '@/components/fa-invoice-view'
import { PdfPreviewFrame } from '@/components/pdf-preview-frame'
import {
  Alert,
  Card,
  EnumBadge,
  tableClassName,
  tdClassName,
  textLinkClassName,
  thClassName,
  trClassName,
} from '@/components/ui-kit'
import { COMPANY_NAME } from '@/lib/brand'
import { ATTACHMENT_KIND } from '@/lib/labels'
import type { DocumentPreview } from '@/server/documents/get-document-preview'
import type { ParsedFaInvoice } from '@/server/documents/parse-fa-xml'

function documentAsInvoiceView(document: DocumentPreview['document']): ParsedFaInvoice {
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
    seller: isPayable ? party : { name: COMPANY_NAME },
    buyer: isPayable ? { name: COMPANY_NAME } : party,
    lines: [],
  }
}

export function DocumentPreviewBody({
  preview,
  compact = false,
}: {
  preview: DocumentPreview
  compact?: boolean
}) {
  const { document, attachments, xmlInvoice, xmlParseFailed, pdfAttachmentId, xmlAttachmentId } =
    preview
  const pdfMeta = attachments.find((item) => item.id === pdfAttachmentId)
  const xmlMeta = attachments.find((item) => item.id === xmlAttachmentId)
  const structured = xmlInvoice ?? documentAsInvoiceView(document)

  return (
    <div className="space-y-6">
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
          <h2 className="text-sm font-semibold text-foreground">PDF</h2>
          <PdfPreviewFrame
            src={`/api/documents/${document.id}/attachments/${pdfAttachmentId}`}
            filename={pdfMeta.filename}
            iframeClassName={
              compact
                ? 'h-[40vh] w-full rounded-xl border border-border bg-muted'
                : undefined
            }
          />
        </section>
      ) : null}

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            {xmlInvoice ? 'Dane z XML KSeF' : 'Dane dokumentu'}
          </h2>
          {xmlAttachmentId && xmlMeta ? (
            <a
              href={`/api/documents/${document.id}/attachments/${xmlAttachmentId}?download=1`}
              className="text-sm text-muted-foreground underline"
            >
              Pobierz XML ({xmlMeta.filename})
            </a>
          ) : null}
        </div>
        <FaInvoiceView invoice={structured} />
      </section>

      {!compact && attachments.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Załączniki</h2>
          <Card className="overflow-x-auto p-0">
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
                  <tr key={attachment.id} className={trClassName}>
                    <td className={tdClassName}>{attachment.filename}</td>
                    <td className={tdClassName}>
                      <EnumBadge value={attachment.kind} labels={ATTACHMENT_KIND} />
                    </td>
                    <td className={tdClassName}>{attachment.mimeType}</td>
                    <td className={tdClassName}>{attachment.sizeBytes} B</td>
                    <td className={tdClassName}>
                      <a
                        href={`/api/documents/${document.id}/attachments/${attachment.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className={textLinkClassName}
                      >
                        Otwórz
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      ) : null}
    </div>
  )
}
