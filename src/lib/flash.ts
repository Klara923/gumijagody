export const FLASH_COOKIE = 'gumijagoda_flash'
export const FLASH_HEADER = 'x-gumijagoda-flash'
export const FLASH_MAX_AGE_SEC = 60
export const FLASH_MAX_MESSAGE_LENGTH = 500

export type FlashTone = 'error' | 'ok'

export type FlashMessage = {
  tone: FlashTone
  message: string
}

export function flashCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
    secure: process.env.NODE_ENV === 'production',
  }
}

export function encodeFlash(flash: FlashMessage): string {
  const payload = {
    tone: flash.tone === 'ok' ? 'ok' : 'error',
    message: flash.message.trim().slice(0, FLASH_MAX_MESSAGE_LENGTH),
  }
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

export function decodeFlash(value: string): FlashMessage | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as {
      tone?: unknown
      message?: unknown
    }
    if (typeof parsed.message !== 'string') return null
    const message = parsed.message.trim().slice(0, FLASH_MAX_MESSAGE_LENGTH)
    if (!message) return null
    return {
      tone: parsed.tone === 'ok' ? 'ok' : 'error',
      message,
    }
  } catch {
    return null
  }
}
