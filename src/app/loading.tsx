export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded-md bg-muted" />
      <div className="mt-6 h-64 animate-pulse rounded-xl bg-muted/70" />
    </main>
  )
}
