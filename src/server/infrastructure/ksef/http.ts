import type { z } from 'zod'

import { KsefError } from './errors'
import { KSEF_QUERY_METADATA_PER_HOUR } from './limits'

const DEFAULT_TIMEOUT_MS = 30_000
const MAX_RETRY_AFTER_MS = 5_000
const DEFAULT_RETRY_AFTER_MS = 1_000

const MAX_DETAIL_LENGTH = 500

export function retryAfterDelayMs(header: string | null): number {
  const seconds = Number.parseInt(header ?? '', 10)
  if (!Number.isFinite(seconds) || seconds < 1) return DEFAULT_RETRY_AFTER_MS
  return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS)
}

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

async function sendKsefRequest(
  url: string,
  init: RequestInit,
  options: { method: string; path: string; timeoutMs: number; signal?: AbortSignal },
): Promise<Response> {
  const run = async () => {
    const timeout = AbortSignal.timeout(options.timeoutMs)
    const combined = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout
    try {
      return await fetch(url, { ...init, signal: combined })
    } catch (cause) {
      if (options.signal?.aborted) throw cause
      if (timeout.aborted) {
        throw new KsefError(
          `KSeF nie odpowiedział w ciągu ${options.timeoutMs} ms (${options.method} ${options.path})`,
          { cause },
        )
      }
      throw new KsefError(`Nie udało się połączyć z KSeF (${options.method} ${options.path})`, {
        cause,
      })
    }
  }

  let response = await run()
  if (response.status === 429) {
    await new Promise((resolve) =>
      setTimeout(resolve, retryAfterDelayMs(response.headers.get('Retry-After'))),
    )
    response = await run()
  }
  return response
}

function rateLimitError(method: string, path: string, raw: string): KsefError {
  return new KsefError(
    `${method} ${path} odrzucone (HTTP 429). Query metadata ma ${KSEF_QUERY_METADATA_PER_HOUR} wywołań/h — zawęź zakres albo spróbuj później.`,
    {
      httpStatus: 429,
      details: raw ? [truncate(raw)] : undefined,
    },
  )
}

export async function ksefFetch<S extends z.ZodType>(
  baseUrl: string,
  path: string,
  request: KsefRequest<S>,
): Promise<z.infer<S>> {
  const { schema, method = 'GET', body, bearer, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = request

  const response = await sendKsefRequest(
    `${baseUrl}${path}`,
    {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        Accept: 'application/json',
        'X-Error-Format': 'problem-details',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
    },
    { method, path, timeoutMs, signal },
  )
  const raw = await response.text()

  if (response.status === 429) throw rateLimitError(method, path, raw)

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

export async function ksefFetchXml(
  baseUrl: string,
  path: string,
  options: {
    bearer: string
    signal?: AbortSignal
    timeoutMs?: number
  },
): Promise<Buffer> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const response = await sendKsefRequest(
    `${baseUrl}${path}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/xml',
        'X-Error-Format': 'problem-details',
        Authorization: `Bearer ${options.bearer}`,
      },
    },
    { method: 'GET', path, timeoutMs, signal: options.signal },
  )
  const bytes = await response.arrayBuffer()

  if (response.status === 429) {
    throw rateLimitError('GET', path, Buffer.from(bytes).toString('utf8'))
  }

  if (!response.ok) {
    const raw = Buffer.from(bytes).toString('utf8')
    throw new KsefError(`GET ${path} zakończone kodem HTTP ${response.status}`, {
      httpStatus: response.status,
      details: raw ? [truncate(raw)] : undefined,
    })
  }

  return Buffer.from(bytes)
}
