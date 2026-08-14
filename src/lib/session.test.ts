import {
  createSessionToken,
  safeInternalPath,
  sessionSecretFrom,
  verifySessionToken,
} from './session'

describe('session', () => {
  it('creates a token that verifies with the same secret', async () => {
    const token = await createSessionToken('secret', 1_000)
    await expect(verifySessionToken(token, 'secret', 1_000)).resolves.toBe(true)
    await expect(verifySessionToken(token, 'other', 1_000)).resolves.toBe(false)
  })

  it('rejects an expired token', async () => {
    const token = await createSessionToken('secret', 1_000)
    await expect(verifySessionToken(token, 'secret', 1_000 + 8 * 24 * 60 * 60 * 1000)).resolves.toBe(
      false,
    )
  })

  it('rejects open redirects and the login loop', () => {
    expect(safeInternalPath('/buffer')).toBe('/buffer')
    expect(safeInternalPath('https://evil.test')).toBe('/')
    expect(safeInternalPath('//evil.test')).toBe('/')
    expect(safeInternalPath('/login')).toBe('/')
  })

  it('derives a session secret from the app password when none is set', () => {
    expect(sessionSecretFrom({ APP_PASSWORD: 'gumijagoda' })).toBe(
      'gumijagoda.session.gumijagoda',
    )
    expect(sessionSecretFrom({})).toBeNull()
  })
})
