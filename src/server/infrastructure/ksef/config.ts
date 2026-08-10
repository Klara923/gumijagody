import { getEnv } from '@/server/env'

import type { KsefCredentials } from './authenticator'
import { KsefError } from './errors'

/**
 * Poświadczenia do środowiska KSeF. Brak kompletu przy `KSEF_CLIENT="http"` to błąd
 * konfiguracji, nie stan do obsłużenia w runtime, dlatego wymuszamy go w jednym miejscu
 * zamiast sprawdzać `undefined` przy każdym wywołaniu API.
 */
export function getKsefCredentials(): KsefCredentials {
  const env = getEnv()

  if (!env.KSEF_NIP || !env.KSEF_TOKEN) {
    throw new KsefError(
      'Integracja HTTP z KSeF wymaga ustawienia KSEF_NIP oraz KSEF_TOKEN w środowisku.\n' +
        'Ustaw KSEF_CLIENT="mock", aby uruchomić aplikację bez poświadczeń KSeF.',
    )
  }

  return {
    baseUrl: env.KSEF_API_BASE_URL,
    nip: env.KSEF_NIP,
    token: env.KSEF_TOKEN,
  }
}
