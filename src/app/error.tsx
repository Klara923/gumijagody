'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { buttonClassName, buttonSecondaryClassName } from '@/components/ui-kit'

function userMessage(error: Error) {
  const message = error.message.trim()
  if (!message || message.includes('\n') || message.length > 280) {
    return 'Nie udało się wczytać tej strony. Spróbuj ponownie albo wróć do listy.'
  }
  return message
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Coś poszło nie tak</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{userMessage(error)}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" className={buttonClassName} onClick={() => reset()}>
          Spróbuj ponownie
        </button>
        <Link href="/" className={buttonSecondaryClassName}>
          Strona główna
        </Link>
      </div>
    </main>
  )
}
