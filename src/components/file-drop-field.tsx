'use client'

import { useId, useRef, useState } from 'react'

import {
  buttonClassName,
  buttonDestructiveClassName,
  buttonSecondaryClassName,
} from '@/components/ui-kit'
import { cn } from '@/lib/utils'

const ACCEPT = '.pdf,.xml,application/pdf,application/xml,text/xml'

function isAllowedFile(file: File) {
  const name = file.name.toLowerCase()
  return (
    name.endsWith('.pdf') ||
    name.endsWith('.xml') ||
    file.type === 'application/pdf' ||
    file.type === 'application/xml' ||
    file.type === 'text/xml'
  )
}

function assignFile(input: HTMLInputElement, file: File | null) {
  const transfer = new DataTransfer()
  if (file) transfer.items.add(file)
  input.files = transfer.files
}

export function FileDropField({
  error: serverError,
  errorKey = 0,
}: {
  error?: string
  errorKey?: number
}) {
  const inputId = useId()
  const hintId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clearedKey, setClearedKey] = useState<number | null>(null)

  function applyFile(file: File | null) {
    const input = inputRef.current
    if (!input) return
    setClearedKey(errorKey)
    if (file && !isAllowedFile(file)) {
      setError('Wybierz plik PDF albo XML.')
      return
    }
    assignFile(input, file)
    setFileName(file?.name ?? null)
    setError(null)
  }

  const shownError = error ?? (serverError && clearedKey !== errorKey ? serverError : undefined)

  return (
    <div className="grid gap-1 text-sm text-foreground">
      <label htmlFor={inputId} className="font-medium">
        Plik (PDF lub XML)
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        name="file"
        accept={ACCEPT}
        required
        aria-describedby={hintId}
        className="sr-only"
        onChange={(event) => applyFile(event.target.files?.[0] ?? null)}
      />
      <div
        onDragEnter={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          event.dataTransfer.dropEffect = 'copy'
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          applyFile(event.dataTransfer.files[0] ?? null)
        }}
        aria-invalid={Boolean(shownError)}
        className={cn(
          'rounded-lg border border-dashed p-4 transition-colors',
          shownError
            ? 'border-destructive bg-destructive/5'
            : dragging
              ? 'border-ring bg-muted/70'
              : 'border-border bg-muted/20',
        )}
      >
        {fileName ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 truncate font-medium">{fileName}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={buttonSecondaryClassName}
                onClick={() => inputRef.current?.click()}
              >
                Podmień
              </button>
              <button
                type="button"
                className={buttonDestructiveClassName}
                onClick={() => applyFile(null)}
              >
                Usuń
              </button>
            </div>
          </div>
        ) : (
          <div className="grid justify-items-center gap-2 py-2 text-center">
            <p className="text-muted-foreground">Przeciągnij plik tutaj albo</p>
            <button
              type="button"
              className={buttonClassName}
              onClick={() => inputRef.current?.click()}
            >
              Wybierz plik
            </button>
          </div>
        )}
      </div>
      {!shownError ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {fileName
            ? 'Podmień wybiera inny plik. Możesz też upuścić nowy w to pole.'
            : 'Możesz też upuścić plik w to pole. PDF albo XML FA(2)/FA(3).'}
        </p>
      ) : null}
      {shownError ? (
        <p id={hintId} className="text-xs text-destructive" role="alert">
          {shownError}
        </p>
      ) : null}
    </div>
  )
}
