export const SESSION_COOKIE = 'gumijagoda_session'
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7

const encoder = new TextEncoder()

export function sessionSecretFrom(env: {
  APP_PASSWORD?: string
  APP_SESSION_SECRET?: string
}): string | null {
  if (env.APP_SESSION_SECRET) return env.APP_SESSION_SECRET
  if (env.APP_PASSWORD) return `gumijagoda.session.${env.APP_PASSWORD}`
  return null
}

export function safeInternalPath(value: unknown): string {
  if (typeof value !== 'string') return '/'
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) return '/'
  return value
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return toBase64Url(signature)
}

function signaturesEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let diff = 0
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return diff === 0
}

export async function createSessionToken(secret: string, now = Date.now()): Promise<string> {
  const expiresAt = String(now + SESSION_MAX_AGE_SEC * 1000)
  return `${expiresAt}.${await hmac(secret, expiresAt)}`
}

export async function verifySessionToken(
  token: string,
  secret: string,
  now = Date.now(),
): Promise<boolean> {
  const separator = token.indexOf('.')
  if (separator <= 0 || separator === token.length - 1) return false
  const expiresAt = token.slice(0, separator)
  const signature = token.slice(separator + 1)
  const expected = await hmac(secret, expiresAt)
  if (!signaturesEqual(signature, expected)) return false
  const expiresAtMs = Number(expiresAt)
  return Number.isFinite(expiresAtMs) && expiresAtMs > now
}
