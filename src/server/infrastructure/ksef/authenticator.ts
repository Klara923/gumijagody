import crypto from 'node:crypto'

import { AUTH_STATUS, KsefError, explainAuthStatus } from './errors'
import { ksefFetch } from './http'
import {
  authInitiatedSchema,
  authStatusSchema,
  authTokensSchema,
  challengeSchema,
  publicKeyCertificatesSchema,
  type AuthStatus,
  type KsefToken,
  type PublicKeyCertificate,
} from './schemas'

/**
 * Uwierzytelnienie w KSeF 2.0 tokenem KSeF.
 *
 * Przebieg wynika z kontraktu OpenAPI środowiska testowego
 * (https://api-test.ksef.mf.gov.pl/docs/v2/openapi.json):
 *
 *   1. POST /auth/challenge                    -> challenge + timestampMs
 *   2. GET  /security/public-key-certificates  -> certyfikat RSA (usage: KsefTokenEncryption)
 *   3. RSA-OAEP (SHA-256) na `${token}|${timestampMs}`
 *   4. POST /auth/ksef-token                   -> referenceNumber + authenticationToken
 *   5. GET  /auth/{referenceNumber}            -> polling do statusu innego niż 100
 *   6. POST /auth/token/redeem                 -> accessToken + refreshToken
 *
 * Moduł celowo nic nie wypisuje na wyjście - postęp raportuje przez `onProgress`,
 * żeby warstwa infrastruktury nie zakładała, kto jej używa (route handler czy CLI).
 */

const CERTIFICATE_USAGE = 'KsefTokenEncryption'

const DEFAULT_POLL_INTERVAL_MS = 2_000
const DEFAULT_POLL_TIMEOUT_MS = 60_000

export type KsefCredentials = {
  baseUrl: string
  /** NIP kontekstu, na który wygenerowano token. */
  nip: string
  token: string
}

export type KsefSession = {
  accessToken: KsefToken
  refreshToken: KsefToken
}

export type AuthenticateOptions = {
  onProgress?: (step: string) => void
  signal?: AbortSignal
  pollIntervalMs?: number
  pollTimeoutMs?: number
}

/** Drzemka przerywalna sygnałem - bez tego anulowanie działa dopiero po jej zakończeniu. */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason)
      return
    }

    const onAbort = () => {
      clearTimeout(timer)
      reject(signal?.reason)
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Wybiera certyfikat o wskazanym zastosowaniu, ważny w danej chwili.
 *
 * Gdy ważnych jest kilka - co zdarza się w okresie rotacji kluczy - bierzemy najnowszy.
 * Kolejność zwracana przez API nie jest gwarantowana, a wybór musi być powtarzalny.
 */
export function selectCertificate(
  certificates: PublicKeyCertificate[],
  usage: string,
  now: Date = new Date(),
): PublicKeyCertificate {
  const timestamp = now.getTime()
  const valid = certificates
    .filter(
      (certificate) =>
        certificate.usage.includes(usage) &&
        certificate.validFrom.getTime() <= timestamp &&
        certificate.validTo.getTime() > timestamp,
    )
    .sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime())

  const newest = valid[0]
  if (!newest) {
    throw new KsefError(`Brak ważnego certyfikatu o zastosowaniu ${usage}`)
  }
  return newest
}

/**
 * Szyfruje `${token}|${timestampMs}` kluczem publicznym Ministerstwa Finansów.
 *
 * Certyfikat przychodzi jako DER w base64, a towarzyszące pole z gotowym PEM-em bywa puste,
 * dlatego klucz publiczny wyciągamy z certyfikatu X.509 zamiast na nim polegać.
 */
export function encryptKsefToken(
  certificateDerBase64: string,
  token: string,
  timestampMs: number,
): string {
  let publicKey: crypto.KeyObject
  try {
    publicKey = new crypto.X509Certificate(Buffer.from(certificateDerBase64, 'base64')).publicKey
  } catch (cause) {
    throw new KsefError('Nie udało się odczytać certyfikatu klucza publicznego KSeF', { cause })
  }

  // Schemat szyfrowania jest związany z rodzajem klucza. Jawne sprawdzenie zamienia
  // enigmatyczny wyjątek biblioteki kryptograficznej w informację, co się właściwie stało.
  if (publicKey.asymmetricKeyType !== 'rsa') {
    throw new KsefError(
      `Certyfikat KSeF używa klucza ${publicKey.asymmetricKeyType ?? 'nieznanego typu'}, ` +
        'a zaimplementowane jest wyłącznie szyfrowanie RSA-OAEP.',
    )
  }

  return crypto
    .publicEncrypt(
      { key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
      Buffer.from(`${token}|${timestampMs}`, 'utf8'),
    )
    .toString('base64')
}

export async function authenticateWithKsefToken(
  credentials: KsefCredentials,
  options: AuthenticateOptions = {},
): Promise<KsefSession> {
  const {
    onProgress = () => {},
    signal,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    pollTimeoutMs = DEFAULT_POLL_TIMEOUT_MS,
  } = options

  const { baseUrl, nip, token } = credentials

  onProgress('Pobieranie challenge')
  const challenge = await ksefFetch(baseUrl, '/auth/challenge', {
    schema: challengeSchema,
    method: 'POST',
    signal,
  })

  onProgress('Pobieranie certyfikatu klucza publicznego')
  const certificates = await ksefFetch(baseUrl, '/security/public-key-certificates', {
    schema: publicKeyCertificatesSchema,
    signal,
  })
  const certificate = selectCertificate(certificates, CERTIFICATE_USAGE)

  onProgress('Szyfrowanie tokena (RSA-OAEP / SHA-256)')
  const encryptedToken = encryptKsefToken(certificate.certificate, token, challenge.timestampMs)

  onProgress('Inicjowanie sesji uwierzytelnienia')
  const initiated = await ksefFetch(baseUrl, '/auth/ksef-token', {
    schema: authInitiatedSchema,
    method: 'POST',
    signal,
    body: {
      challenge: challenge.challenge,
      contextIdentifier: { type: 'Nip', value: nip },
      encryptedToken,
      publicKeyId: certificate.publicKeyId,
    },
  })

  onProgress(`Oczekiwanie na wynik (${initiated.referenceNumber})`)
  const status = await waitForAuthentication(baseUrl, initiated, {
    signal,
    pollIntervalMs,
    pollTimeoutMs,
    onProgress,
  })

  if (status.status.code !== AUTH_STATUS.SUCCESS) {
    const hint = explainAuthStatus(status.status.code)
    throw new KsefError(
      `Uwierzytelnienie nieudane: ${status.status.description}${hint ? `\n${hint}` : ''}`,
      { ksefCode: status.status.code, details: status.status.details ?? undefined },
    )
  }

  onProgress('Wymiana na token dostępu')
  return ksefFetch(baseUrl, '/auth/token/redeem', {
    schema: authTokensSchema,
    method: 'POST',
    bearer: initiated.authenticationToken.token,
    signal,
  })
}

async function waitForAuthentication(
  baseUrl: string,
  initiated: { referenceNumber: string; authenticationToken: KsefToken },
  options: Required<Pick<AuthenticateOptions, 'pollIntervalMs' | 'pollTimeoutMs' | 'onProgress'>> &
    Pick<AuthenticateOptions, 'signal'>,
): Promise<AuthStatus> {
  const deadline = Date.now() + options.pollTimeoutMs

  for (;;) {
    const status = await ksefFetch(baseUrl, `/auth/${initiated.referenceNumber}`, {
      schema: authStatusSchema,
      bearer: initiated.authenticationToken.token,
      signal: options.signal,
    })
    options.onProgress(`Status ${status.status.code}: ${status.status.description}`)

    if (status.status.code !== AUTH_STATUS.IN_PROGRESS) return status

    if (Date.now() > deadline) {
      throw new KsefError('Przekroczono czas oczekiwania na zakończenie uwierzytelnienia', {
        ksefCode: status.status.code,
      })
    }
    await sleep(options.pollIntervalMs, options.signal)
  }
}
