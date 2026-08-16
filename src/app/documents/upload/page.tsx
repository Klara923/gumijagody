import type { Metadata } from 'next'

import { UploadDocumentForm } from '@/components/upload-document-form'
import { PageShell } from '@/components/page-shell'
import { Card } from '@/components/ui-kit'
import { listDocumentTypes } from '@/server/document-types/list-document-types'

export const metadata: Metadata = { title: 'Wgraj PDF / XML' }

export default async function UploadDocumentPage() {
  const types = await listDocumentTypes()

  return (
    <PageShell
      title="Wgraj PDF / XML"
      description="XML FA wczytuje dane automatycznie. Przy PDF uzupełnij metadane poniżej."
    >
      <Card className="max-w-2xl">
        <UploadDocumentForm types={types} />
      </Card>
    </PageShell>
  )
}
