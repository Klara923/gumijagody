import { NextResponse } from 'next/server'

import { getDocumentAttachment } from '@/server/documents/attachments'
import { DocumentError } from '@/server/documents/errors'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string; attachmentId: string }>
}

function contentDisposition(filename: string, disposition: 'inline' | 'attachment') {
  const safe = filename.replace(/[^\w.\- ()ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+/gi, '_')
  const encoded = encodeURIComponent(filename)
  return `${disposition}; filename="${safe}"; filename*=UTF-8''${encoded}`
}

export async function GET(request: Request, context: RouteContext) {
  const { id, attachmentId } = await context.params
  const download = new URL(request.url).searchParams.get('download') === '1'

  try {
    const attachment = await getDocumentAttachment(id, attachmentId)
    const body = Buffer.from(attachment.content)

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': attachment.mimeType || 'application/octet-stream',
        'Content-Length': String(body.byteLength),
        'Content-Disposition': contentDisposition(
          attachment.filename,
          download ? 'attachment' : 'inline',
        ),
        'Cache-Control': 'private, max-age=60',
      },
    })
  } catch (error) {
    if (error instanceof DocumentError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }
}
