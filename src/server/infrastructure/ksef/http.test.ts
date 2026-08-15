import { retryAfterDelayMs } from './http'

describe('retryAfterDelayMs', () => {
  it('reads Retry-After seconds and caps the wait', () => {
    expect(retryAfterDelayMs('3')).toBe(3000)
    expect(retryAfterDelayMs('30')).toBe(5000)
    expect(retryAfterDelayMs(null)).toBe(1000)
    expect(retryAfterDelayMs('nope')).toBe(1000)
  })
})
