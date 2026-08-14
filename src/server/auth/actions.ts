'use server'

import { createHash, timingSafeEqual } from 'node:crypto'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  createSessionToken,
  safeInternalPath,
  sessionSecretFrom,
} from '@/lib/session'
import { getEnv } from '@/server/env'

function passwordsEqual(provided: string, expected: string): boolean {
  const left = createHash('sha256').update(provided).digest()
  const right = createHash('sha256').update(expected).digest()
  return timingSafeEqual(left, right)
}

export async function loginAction(formData: FormData) {
  const env = getEnv()
  const from = safeInternalPath(formData.get('from'))

  if (!env.APP_PASSWORD) redirect(from)

  const password = formData.get('password')
  if (typeof password !== 'string' || !passwordsEqual(password, env.APP_PASSWORD)) {
    redirect(`/login?error=1&from=${encodeURIComponent(from)}`)
  }

  const secret = sessionSecretFrom(env)
  if (!secret) redirect(from)

  const store = await cookies()
  store.set(SESSION_COOKIE, await createSessionToken(secret), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  })

  redirect(from)
}

export async function logoutAction() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  redirect('/login')
}
