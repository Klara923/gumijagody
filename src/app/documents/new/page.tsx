import type { Metadata } from 'next'

import { NewDocumentForm } from '@/components/new-document-form'
import { PageShell } from '@/components/page-shell'
import { Card } from '@/components/ui-kit'
import { listCategoryOptions } from '@/server/categories/list-categories'
import { listDocumentTypes } from '@/server/document-types/list-document-types'

export const metadata: Metadata = { title: 'Wpis ręczny' }

export default async function NewDocumentPage() {
  const types = await listDocumentTypes()
  const categories = await listCategoryOptions()

  return (
    <PageShell title="Wpis ręczny" description="Ręczne dodanie trafia od razu do rejestru.">
      <Card className="max-w-2xl">
        <NewDocumentForm types={types} categories={categories} />
      </Card>
    </PageShell>
  )
}
