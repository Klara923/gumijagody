import { decodeFlash, encodeFlash } from './flash'

describe('flash cookie payload', () => {
  it('round-trips a success message', () => {
    const encoded = encodeFlash({ tone: 'ok', message: 'Usunięto regułę.' })
    expect(decodeFlash(encoded)).toEqual({ tone: 'ok', message: 'Usunięto regułę.' })
  })

  it('treats an unknown tone as an error', () => {
    const encoded = encodeFlash({ tone: 'error', message: 'Nieprawidłowe dane' })
    expect(decodeFlash(encoded)).toEqual({ tone: 'error', message: 'Nieprawidłowe dane' })
  })

  it('rejects empty or broken values', () => {
    expect(decodeFlash('')).toBeNull()
    expect(decodeFlash('not-base64')).toBeNull()
    expect(decodeFlash(encodeFlash({ tone: 'ok', message: '   ' }))).toBeNull()
  })
})
