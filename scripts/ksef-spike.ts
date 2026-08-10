/**
 * Diagnostyka uwierzytelnienia w środowisku testowym KSeF.
 *
 * Uruchomienie:  npm run ksef:spike
 *
 * Skrypt nie zawiera logiki integracji - woła dokładnie ten sam kod, z którego korzysta
 * aplikacja (`src/server/infrastructure/ksef`). Odpowiada na jedno pytanie: czy moje
 * poświadczenia i wybrane środowisko faktycznie pozwalają uzyskać token dostępu.
 * Dzięki temu problem z konfiguracją odróżnisz od problemu z kodem, nie uruchamiając
 * całej aplikacji.
 */

import 'dotenv/config'

import { authenticateWithKsefToken } from '../src/server/infrastructure/ksef/authenticator'
import { getKsefCredentials } from '../src/server/infrastructure/ksef/config'
import { KsefError } from '../src/server/infrastructure/ksef/errors'

const mask = (token: string) => `${token.slice(0, 24)}… (${token.length} znaków)`

/** Czas życia tokena czytamy z pola `exp`, bo API nie gwarantuje stałej wartości. */
function decodeJwtExpiry(jwt: string): string {
  const payload = jwt.split('.')[1]
  if (!payload) return 'nie udało się odczytać'

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: number
    }
    return decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'brak pola exp'
  } catch {
    return 'nie udało się odczytać'
  }
}

async function main(): Promise<void> {
  const credentials = getKsefCredentials()

  console.log(`▶ Środowisko: ${credentials.baseUrl}`)
  console.log(`▶ Kontekst:   NIP ${credentials.nip}\n`)

  let step = 0
  const session = await authenticateWithKsefToken(credentials, {
    onProgress: (message) => console.log(`  ${String(++step).padStart(2)}. ${message}`),
  })

  console.log('\n✅ Uwierzytelnienie zakończone sukcesem\n')
  console.log(`   accessToken:  ${mask(session.accessToken.token)}`)
  console.log(`   ważny do:     ${session.accessToken.validUntil.toISOString()}`)
  console.log(`   exp z JWT:    ${decodeJwtExpiry(session.accessToken.token)}`)
  console.log(`   refreshToken: ${mask(session.refreshToken.token)}`)
  console.log(`   ważny do:     ${session.refreshToken.validUntil.toISOString()}`)
}

main().catch((error: unknown) => {
  if (error instanceof KsefError) {
    console.error(`\n❌ ${error.message}`)
    if (error.details?.length) console.error(error.details.join('\n'))
  } else {
    console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}`)
  }
  process.exit(1)
})
