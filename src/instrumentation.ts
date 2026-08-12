export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  // Na Vercel cron HTTP + zewnętrzny scheduler; node-cron tylko w długo żyjącym procesie (Docker/dev).
  if (process.env.VERCEL) return

  const { startKsefScheduler } = await import('@/server/schedule/ksef-scheduler')
  await startKsefScheduler()
}
