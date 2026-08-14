import { isPrismaUniqueViolation } from './unique-violation'

describe('isPrismaUniqueViolation', () => {
  it('detects Prisma P2002', () => {
    expect(isPrismaUniqueViolation({ code: 'P2002' })).toBe(true)
  })

  it('rejects other errors', () => {
    expect(isPrismaUniqueViolation({ code: 'P2003' })).toBe(false)
    expect(isPrismaUniqueViolation(new Error('P2002'))).toBe(false)
    expect(isPrismaUniqueViolation(null)).toBe(false)
    expect(isPrismaUniqueViolation('P2002')).toBe(false)
  })
})
