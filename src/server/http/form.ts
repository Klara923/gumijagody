import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { redirect } from 'next/navigation'

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

export function redirectWithError(path: string, error: unknown): never {
  if (isRedirectError(error)) throw error
  redirect(`${path}?error=${encodeURIComponent(errorMessage(error))}`)
}
