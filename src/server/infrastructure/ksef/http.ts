import type { z } from 'zod'

import { KsefError } from './errors'

/**
 * Bez limitu czasu żądanie do milczącego serwera wisi w nieskończoność. Przy nocnym
 * harmonogramie oznaczałoby to zadanie blokujące kolejne uruchomienia aż do rana.
 */
const DEFAULT_TIMEOUT_MS = 30_000

/** Ciało błędu bywa stroną HTML od proxy - w diagnostyce liczy się początek, nie całość. */
const MAX_DETAIL_LENGTH = 500

export type KsefRequest<S extends z.ZodType> = {
  /** Schemat odpowiedzi. Wymagany, bo dane z KSeF są wejściem niezaufanym. */
  schema: S
  method?: 'GET' | 'POST'
  body?: unknown
  /** Token przekazywany w nagłówku Authorization (authenticationToken albo accessToken). */
  bearer?: string
  signal?: AbortSignal
  timeoutMs?: number
}

const truncate = (text: string) =>
  text.length > MAX_DETAIL_LENGTH ? `${text.slice(0, MAX_DETAIL_LENGTH)}… (ucięto)` : text

/**
 * Cienki klient HTTP dla API KSeF. Jedyne miejsce, w którym znamy kształt transportu -
 * dzięki temu obsługa błędów, nagłówki i limity czasu są spójne dla wszystkich wywołań,
 * a każda odpowiedź jest zwalidowana zanim opuści tę funkcję.
 */
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
        // Ustandaryzowany format błędów (RFC 7807) zamiast własnego kształtu odpowiedzi KSeF.
        'X-Error-Format': 'problem-details',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
    })
    raw = await response.text()
  } catch (cause) {
    // Przerwanie zlecone przez wołającego nie jest awarią integracji - przekazujemy je dalej
    // bez zmiany typu, żeby nie udawać, że to KSeF zawiódł.
    if (signal?.aborted) throw cause

    if (timeout.aborted) {
      throw new KsefError(`KSeF nie odpowiedział w ciągu ${timeoutMs} ms (${method} ${path})`, {
        cause,
      })
    }
    // Niedostępność KSeF jest normalnym stanem, nie wyjątkiem od reguły - opakowujemy ją
    // w ten sam typ błędu co odpowiedzi negatywne, żeby wołający miał jedną ścieżkę obsługi.
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
