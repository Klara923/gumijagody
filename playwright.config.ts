import { execFileSync } from 'node:child_process'

import { defineConfig, devices } from '@playwright/test'

function isListening(url: string) {
  try {
    execFileSync('curl', ['-s', '-o', '/dev/null', '-m', '1', url], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  (isListening('http://127.0.0.1:3001')
    ? 'http://127.0.0.1:3001'
    : isListening('http://127.0.0.1:3000')
      ? 'http://127.0.0.1:3000'
      : 'http://127.0.0.1:3000')

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer:
    process.env.PLAYWRIGHT_BASE_URL || isListening(baseURL)
      ? undefined
      : {
          command: 'npm run dev -- --hostname 127.0.0.1 --port 3000',
          url: 'http://127.0.0.1:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
