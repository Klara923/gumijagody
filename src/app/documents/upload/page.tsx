import { UploadDocumentForm } from '@/components/upload-document-form'
import { Card, PageShell } from '@/components/ui-kit'
import { listDocumentTypes } from '@/server/document-types/list-document-types'

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
