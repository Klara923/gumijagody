'use client'

type Props = {
  src: string
  filename: string
}

export function PdfPreviewFrame({ src, filename }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-zinc-800 hover:bg-zinc-50"
        >
          Otwórz w nowej karcie
        </a>
        <a
          href={`${src}?download=1`}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-zinc-800 hover:bg-zinc-50"
        >
          Pobierz PDF
        </a>
        <span className="text-xs text-zinc-500">{filename}</span>
      </div>
      <p className="text-xs text-zinc-500">
        Zoom i przewijanie stron — wbudowane kontrolki przeglądarki w ramce poniżej.
      </p>
      <iframe
        src={src}
        title={`Podgląd PDF: ${filename}`}
        className="h-[75vh] w-full rounded-lg border border-zinc-200 bg-zinc-100"
      />
    </div>
  )
}
