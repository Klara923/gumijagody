'use client'

import { useId, useState } from 'react'

import { buttonClassName, buttonSecondaryClassName } from '@/components/ui-kit'

function selectedCountLabel(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (count === 1) return '1 dokument'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} dokumenty`
  return `${count} dokumentów`
}

export function ConfirmAccept({ form }: { form: string }) {
  const titleId = useId()
  const descriptionId = useId()
  const [count, setCount] = useState<number | null>(null)

  function selectedCount() {
    const formElement = document.getElementById(form)
    return formElement
      ? formElement.querySelectorAll('input[name="ids"]:checked').length
      : 0
  }

  return (
    <>
      <button type="button" className={buttonClassName} onClick={() => setCount(selectedCount())}>
        Akceptuj zaznaczone
      </button>
      {count !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
          onClick={() => setCount(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="grid w-[min(100%,24rem)] gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
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
                onClick={() => setCount(null)}
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
        </div>
      ) : null}
    </>
  )
}
