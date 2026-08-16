import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test, type Page } from '@playwright/test'

async function signIn(page: Page) {
  await page.goto('/documents')
  if (!page.url().includes('/login')) return

  await page.locator('input[name="password"]').fill(process.env.APP_PASSWORD ?? 'gumijagoda')
  await page.getByRole('button', { name: 'Wejdź' }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'))
}

async function uniqueFa2Path(number: string) {
  const xml = await readFile(join(process.cwd(), 'fixtures/ksef/FA2.xml'), 'utf8')
  const today = new Date().toISOString().slice(0, 10)
  const stamped = xml
    .replace('<P_1>2023-08-31</P_1>', `<P_1>${today}</P_1>`)
    .replace('<P_2>FK2023/08/31</P_2>', `<P_2>${number}</P_2>`)
  const dir = await mkdtemp(join(tmpdir(), 'rejestrka-e2e-'))
  const file = join(dir, `${number}.xml`)
  await writeFile(file, stamped)
  return file
}

test('manual document is in the register and preview shows form data', async ({ page }) => {
  const number = `FV-E2E-${Date.now()}`
  await signIn(page)

  await page.goto('/documents/new')
  await page.locator('input[name="number"]').fill(number)
  const typeSelect = page.locator('select[name="typeId"]')
  const typeValue = await typeSelect
    .locator('option')
    .filter({ hasText: 'Faktura kosztowa' })
    .first()
    .getAttribute('value')
  expect(typeValue).toBeTruthy()
  await typeSelect.selectOption(typeValue!)
  await expect(async () => {
    await page.locator('input[name="contractorName"]').fill('E2E Kontrahent')
    await expect(page.locator('input[name="contractorName"]')).toHaveValue('E2E Kontrahent')
  }).toPass()
  await page.locator('input[name="issueDate"]').fill('2026-08-15')
  await page.locator('input[name="netAmount"]').fill('100.00')
  await page.locator('input[name="vatAmount"]').fill('23.00')
  await page.locator('input[name="grossAmount"]').fill('123.00')
  await page.getByRole('button', { name: 'Zapisz' }).click()

  await page.waitForURL(/\/documents\/[^/]+$/)
  await expect(page.getByRole('heading', { name: number, level: 1 })).toBeVisible()

  await page.goto('/documents')
  const row = page.locator('tbody tr', { hasText: number })
  await expect(row).toBeVisible()
  await expect(row.getByText('E2E Kontrahent')).toBeVisible()

  const preview = await row.getByRole('link', { name: 'Podgląd' }).getAttribute('href')
  expect(preview).toBeTruthy()
  await page.goto(preview!)
  await expect(page.getByRole('heading', { name: `Podgląd: ${number}` })).toBeVisible()
  await expect(page.getByText('E2E Kontrahent', { exact: true })).toBeVisible()
  await expect(page.getByText(/100(?:\.00)? \/ 23(?:\.00)? \/ 123(?:\.00)? PLN/)).toBeVisible()
})

test('uploaded FA XML goes through buffer, accept, register, and structured preview', async ({ page }) => {
  const number = `FK-E2E-${Date.now()}`
  await signIn(page)

  await page.goto('/documents/upload')
  await page.locator('input[name="file"]').setInputFiles(await uniqueFa2Path(number))
  await page.getByRole('button', { name: 'Wgraj do bufora' }).click()
  await page.waitForURL(/\/(buffer|documents\/upload)/)

  if (page.url().includes('/documents/upload')) {
    const message = (await page.locator('main').innerText()).slice(0, 400)
    throw new Error(
      `Upload nie trafił do bufora. Ustaw KSEF_NIP=4728391059. ${message}`,
    )
  }

  const bufferRow = page.locator('tbody tr', { hasText: number })
  await expect(bufferRow).toBeVisible()

  const bufferPreview = await bufferRow.getByRole('link', { name: 'Podgląd' }).getAttribute('href')
  expect(bufferPreview).toBeTruthy()
  await page.goto(bufferPreview!)
  await expect(page.getByRole('heading', { name: 'Dane z XML KSeF' })).toBeVisible()
  await expect(page.getByText('ABC AGD sp. z o. o.', { exact: true })).toBeVisible()
  await expect(page.locator('body')).not.toContainText('<?xml')
  await expect(page.locator('body')).not.toContainText('<Faktura')

  await page.goto('/buffer')
  const row = page.locator('tbody tr', { hasText: number })
  await row.locator('input[name="ids"]').check()
  await page.locator('form#buffer-accept').evaluate((form) => {
    (form as HTMLFormElement).requestSubmit()
  })
  await expect(page.getByText('Zaakceptowano wybrane dokumenty.')).toBeVisible()
  await expect(page.locator('tbody tr', { hasText: number })).toHaveCount(0)

  await page.goto('/documents')
  const registerRow = page.locator('tbody tr', { hasText: number })
  await expect(registerRow).toBeVisible()
  const registerPreview = await registerRow.getByRole('link', { name: 'Podgląd' }).getAttribute('href')
  expect(registerPreview).toBeTruthy()
  await page.goto(registerPreview!)
  await expect(page.getByRole('heading', { name: `Podgląd: ${number}` })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Dane z XML KSeF' })).toBeVisible()
  await expect(page.getByText('ABC AGD sp. z o. o.', { exact: true })).toBeVisible()
})
