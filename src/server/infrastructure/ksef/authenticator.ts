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

const CERTIFICATE_USAGE = 'KsefTokenEncryption'

const DEFAULT_POLL_INTERVAL_MS = 2_000
const DEFAULT_POLL_TIMEOUT_MS = 60_000

export type KsefCredentials = {
  baseUrl: string
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
