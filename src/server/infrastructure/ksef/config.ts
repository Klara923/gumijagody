import { getEnv } from '@/server/env'

import type { KsefCredentials } from './authenticator'
import { KsefError } from './errors'

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
