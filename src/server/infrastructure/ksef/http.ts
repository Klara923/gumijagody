import type { z } from 'zod'

import { KsefError } from './errors'

const DEFAULT_TIMEOUT_MS = 30_000

const MAX_DETAIL_LENGTH = 500

export type KsefRequest<S extends z.ZodType> = {
  schema: S
  method?: 'GET' | 'POST'
  body?: unknown
  bearer?: string
  signal?: AbortSignal
  timeoutMs?: number
}

const truncate = (text: string) =>
  text.length > MAX_DETAIL_LENGTH ? `${text.slice(0, MAX_DETAIL_LENGTH)}… (ucięto)` : text

export async function ksefFetch<S extends z.ZodType>(
  baseUrl: string,
  path: string,
  request: KsefRequest<S>,
): Promise<z.infer<S>> {
  const { schema, method = 'GET', body, bearer, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = request

  const timeout = AbortSignal.timeout(timeoutMs)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout

  let response: Response
  let raw: string
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: combined,
      headers: {
        Accept: 'application/json',
        'X-Error-Format': 'problem-details',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
    })
    raw = await response.text()
  } catch (cause) {
    if (signal?.aborted) throw cause

    if (timeout.aborted) {
      throw new KsefError(`KSeF nie odpowiedział w ciągu ${timeoutMs} ms (${method} ${path})`, {
        cause,
      })
    }
    throw new KsefError(`Nie udało się połączyć z KSeF (${method} ${path})`, { cause })
  }

  if (!response.ok) {
    throw new KsefError(`${method} ${path} zakończone kodem HTTP ${response.status}`, {
      httpStatus: response.status,
      details: raw ? [truncate(raw)] : undefined,
    })
  }

  let payload: unknown
  try {
    payload = raw ? JSON.parse(raw) : undefined
  } catch (cause) {
    throw new KsefError(`Odpowiedź KSeF (${method} ${path}) nie jest poprawnym JSON-em`, {
      httpStatus: response.status,
      details: raw ? [truncate(raw)] : undefined,
      cause,
    })
  }

  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    throw new KsefError(
      `Odpowiedź KSeF (${method} ${path}) nie pasuje do oczekiwanego kontraktu. ` +
        'Prawdopodobnie zmieniła się wersja API.',
      {
        httpStatus: response.status,
        details: parsed.error.issues.map(
          (issue) => `${issue.path.join('.') || '(korzeń)'}: ${issue.message}`,
        ),
      },
    )
  }

  return parsed.data
}
