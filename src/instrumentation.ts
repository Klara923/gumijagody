export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startKsefScheduler } = await import('@/server/schedule/ksef-scheduler')
    startKsefScheduler()
  }
}
