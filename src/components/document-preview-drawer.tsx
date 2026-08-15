'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'

import { DocumentPreviewBody } from '@/components/document-preview-body'
import { buttonSecondaryClassName, textLinkClassName } from '@/components/ui-kit'
import type { DocumentPreview } from '@/server/documents/get-document-preview'
import { loadDocumentPreviewAction } from '@/server/documents/load-preview'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; preview: DocumentPreview }

export function PreviewButton({
  documentId,
  className = textLinkClassName,
}: {
  documentId: string
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <a
        href={`/documents/${documentId}/preview`}
        className={className}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
            return
          }
          event.preventDefault()
          setOpen(true)
        }}
      >
        Podgląd
      </a>
      {open ? (
        <DocumentPreviewDrawer
          key={documentId}
          documentId={documentId}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}

function DocumentPreviewDrawer({
  documentId,
  onClose,
}: {
  documentId: string
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    let cancelled = false
    void loadDocumentPreviewAction(documentId).then((result) => {
      if (cancelled) return
      if (result.ok) setState({ status: 'ready', preview: result.preview })
      else setState({ status: 'error', message: result.error })
    })
    return () => {
      cancelled = true
    }
  }, [documentId])

  const title =
    state.status === 'ready' ? `Podgląd: ${state.preview.document.number}` : 'Podgląd dokumentu'

  return (
    <dialog
      ref={dialogRef}
      data-testid="document-preview-drawer"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close()
      }}
      className="m-0 ml-auto h-dvh w-[min(100%,42rem)] max-h-dvh max-w-none overflow-hidden rounded-none border-0 border-l border-border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-foreground/40"
    >
      <div className="flex h-full flex-col">
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
          <h2 id={titleId} className="text-base font-semibold tracking-tight">
            {title}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/documents/${documentId}/preview`}
              className={buttonSecondaryClassName}
            >
              Otwórz na pełnym ekranie
            </Link>
            <button
              type="button"
              className={buttonSecondaryClassName}
              onClick={() => dialogRef.current?.close()}
            >
              Zamknij
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {state.status === 'loading' ? (
            <p className="text-sm text-muted-foreground">Wczytuję podgląd…</p>
          ) : null}
          {state.status === 'error' ? (
            <p className="text-sm text-red-700">{state.message}</p>
          ) : null}
          {state.status === 'ready' ? (
            <DocumentPreviewBody preview={state.preview} compact />
          ) : null}
        </div>
      </div>
    </dialog>
  )
}
