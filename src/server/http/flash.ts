import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import {
  FLASH_COOKIE,
  FLASH_HEADER,
  FLASH_MAX_AGE_SEC,
  decodeFlash,
  encodeFlash,
  flashCookieOptions,
  type FlashMessage,
} from '@/lib/flash'

export type { FlashMessage }

export function readFlashFromHeaders(headerStore: Headers): FlashMessage | null {
  const raw = headerStore.get(FLASH_HEADER)
  return raw ? decodeFlash(raw) : null
}

export async function setFlashCookie(flash: FlashMessage) {
  const store = await cookies()
  store.set(FLASH_COOKIE, encodeFlash(flash), flashCookieOptions(FLASH_MAX_AGE_SEC))
}

export async function redirectWithFlash(path: string, flash: FlashMessage): Promise<never> {
  await setFlashCookie(flash)
  redirect(path)
}

export async function redirectWithOk(path: string, message: string): Promise<never> {
  return redirectWithFlash(path, { tone: 'ok', message })
}
