'use client'

import { useId, useRef } from 'react'

import {
  buttonDestructiveClassName,
  buttonSecondaryClassName,
} from '@/components/ui-kit'

type ConfirmDeleteProps = {
  action: (formData: FormData) => void | Promise<void>
  fields?: Record<string, string>
  label?: string
  title: string
  description?: string
}

export function ConfirmDelete({
  action,
  fields,
  label = 'Usuń',
  title,
  description,
}: ConfirmDeleteProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  return (
    <>
      <button
        type="button"
        className={buttonDestructiveClassName}
        onClick={() => dialogRef.current?.showModal()}
      >
        {label}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="w-[min(100%,24rem)] rounded-xl border border-border bg-card p-5 text-card-foreground shadow-lg backdrop:bg-foreground/40"
      >
        <form action={action} className="grid gap-4">
          {fields
            ? Object.entries(fields).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
              ))
            : null}
          <div className="grid gap-1">
            <h2 id={titleId} className="text-base font-semibold tracking-tight">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={buttonSecondaryClassName}
              onClick={() => dialogRef.current?.close()}
            >
              Anuluj
            </button>
            <button type="submit" className={buttonDestructiveClassName}>
              Usuń
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
