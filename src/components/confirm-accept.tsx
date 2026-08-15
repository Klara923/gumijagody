'use client'

import { useId, useRef, useState } from 'react'

import { buttonClassName, buttonSecondaryClassName } from '@/components/ui-kit'

function selectedCountLabel(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (count === 1) return '1 dokument'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} dokumenty`
  return `${count} dokumentów`
}

export function ConfirmAccept({ form }: { form: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const [count, setCount] = useState(0)

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => {
          const formElement = document.getElementById(form)
          const selected = formElement
            ? formElement.querySelectorAll('input[name="ids"]:checked').length
            : 0
          setCount(selected)
          dialogRef.current?.showModal()
        }}
      >
        Akceptuj zaznaczone
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-[min(100%,24rem)] rounded-xl border border-border bg-card p-5 text-card-foreground shadow-lg backdrop:bg-foreground/40"
      >
        <div className="grid gap-4">
          <div className="grid gap-1">
            <h2 id={titleId} className="text-base font-semibold tracking-tight">
              {count === 0
                ? 'Nic nie zaznaczono'
                : `Zaakceptować ${selectedCountLabel(count)}?`}
            </h2>
            <p id={descriptionId} className="text-sm text-muted-foreground">
              {count === 0
                ? 'Zaznacz dokumenty w tabeli, potem spróbuj ponownie.'
                : 'Trafią do rejestru. Z bufora znikną.'}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={buttonSecondaryClassName}
              onClick={() => dialogRef.current?.close()}
            >
              Anuluj
            </button>
            {count > 0 ? (
              <button type="submit" form={form} className={buttonClassName}>
                Akceptuj
              </button>
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  )
}
