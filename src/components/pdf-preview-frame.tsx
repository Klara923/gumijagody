'use client'

import { buttonSecondaryClassName } from '@/components/ui-kit'

type Props = {
  src: string
  filename: string
  iframeClassName?: string
}

export function PdfPreviewFrame({ src, filename, iframeClassName }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <a href={src} target="_blank" rel="noreferrer" className={buttonSecondaryClassName}>
          Otwórz w nowej karcie
        </a>
        <a href={`${src}?download=1`} className={buttonSecondaryClassName}>
          Pobierz PDF
        </a>
        <span className="text-xs text-muted-foreground">{filename}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Zoom i przewijanie stron — wbudowane kontrolki przeglądarki w ramce poniżej.
      </p>
      <iframe
        src={src}
        title={`Podgląd PDF: ${filename}`}
        className={
          iframeClassName ?? 'h-[75vh] w-full rounded-xl border border-border bg-muted'
        }
      />
    </div>
  )
}
