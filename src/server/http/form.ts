import { isRedirectError } from 'next/dist/client/components/redirect-error'

import { redirectWithFlash } from '@/server/http/flash'

export function formString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

export function optionalFormString(formData: FormData, key: string) {
  const value = formString(formData, key).trim()
  return value === '' ? undefined : value
}

export function errorMessage(error: unknown) {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  return 'Nieoczekiwany błąd'
}

export async function redirectWithError(path: string, error: unknown): Promise<never> {
  if (isRedirectError(error)) throw error
  return redirectWithFlash(path, { tone: 'error', message: errorMessage(error) })
}
