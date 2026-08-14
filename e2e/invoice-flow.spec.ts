import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test, type Page } from '@playwright/test'

async function loginIfNeeded(page: Page) {
  await page.goto('/documents/upload')
  if (!page.url().includes('/login')) return

  await page.locator('input[name="password"]').fill(process.env.APP_PASSWORD ?? 'gumijagoda')
  await page.getByRole('button', { name: 'Wejdź' }).click()
  await page.waitForURL(/\/documents\/upload/)
}

async function fa2UploadPath(invoiceNumber: string) {
  const xml = await readFile(join(process.cwd(), 'fixtures/ksef/FA2.xml'), 'utf8')
  const today = new Date().toISOString().slice(0, 10)
  const stamped = xml
    .replace('<P_1>2023-08-31</P_1>', `<P_1>${today}</P_1>`)
    .replace('<P_2>FK2023/08/31</P_2>', `<P_2>${invoiceNumber}</P_2>`)
  const dir = await mkdtemp(join(tmpdir(), 'rejestrka-e2e-'))
  const path = join(dir, 'FA2.xml')
  await writeFile(path, stamped)
  return path
}

test('upload FA XML to buffer, accept into register, preview is structured', async ({ page }) => {
  const invoiceNumber = `FK-E2E-${Date.now()}`
  await loginIfNeeded(page)

  await page.locator('input[name="file"]').setInputFiles(await fa2UploadPath(invoiceNumber))
  await page.getByRole('button', { name: 'Wgraj do bufora' }).click()
  await page.waitForURL(/\/(buffer|documents\/upload)/)

  if (page.url().includes('/documents/upload')) {
    const message = (await page.locator('main').innerText()).slice(0, 500)
    throw new Error(
      `Upload nie trafił do bufora. Ustaw KSEF_NIP na NIP z FA2.xml (4728391059). ${message}`,
    )
  }

  await expect(page.getByText(invoiceNumber)).toBeVisible()
  await page.locator('tr', { hasText: invoiceNumber }).locator('input[name="ids"]').check()
  await page.getByRole('button', { name: 'Akceptuj zaznaczone' }).click()
  await page.waitForURL(/\/buffer/)

  await page.goto('/documents')
  const row = page.locator('tr', { hasText: invoiceNumber })
  await expect(row).toBeVisible()

  const previewHref = await row.getByRole('link', { name: 'Podgląd' }).getAttribute('href')
  if (!previewHref) throw new Error('Wiersz w rejestrze nie ma linku Podgląd')
  await page.goto(previewHref)
  await expect(page.getByRole('heading', { name: 'Dane z XML KSeF' })).toBeVisible()
  await expect(page.getByText('ABC AGD sp. z o. o.')).toBeVisible()
  await expect(page.locator('body')).not.toContainText('<?xml')
  await expect(page.locator('body')).not.toContainText('<Faktura')
})
