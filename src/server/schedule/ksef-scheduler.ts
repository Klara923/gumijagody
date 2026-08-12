import 'server-only'

declare global {
  var __gumijagodyKsefSchedulerStarted: boolean | undefined
}

export async function startKsefScheduler() {
  if (globalThis.__gumijagodyKsefSchedulerStarted) return
  globalThis.__gumijagodyKsefSchedulerStarted = true

  const cron = (await import('node-cron')).default
  const { runScheduledKsefImport } = await import('./run-scheduled-import')

  cron.schedule('* * * * *', () => {
    void runScheduledKsefImport().catch((error) => {
      console.error('[ksef-scheduler]', error)
    })
  })

  console.info('[ksef-scheduler] started (tick every minute, slots from ScheduleSetting)')
}
