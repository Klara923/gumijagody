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

  it('matches a named unique field from Prisma meta.target', () => {
    expect(
      isPrismaUniqueViolation({ code: 'P2002', meta: { target: ['checksum'] } }, 'checksum'),
    ).toBe(true)
    expect(
      isPrismaUniqueViolation(
        { code: 'P2002', meta: { target: ['Attachment_checksum_key'] } },
        'checksum',
      ),
    ).toBe(true)
    expect(
      isPrismaUniqueViolation({ code: 'P2002', meta: { target: ['checksum'] } }, 'number'),
    ).toBe(false)
    expect(isPrismaUniqueViolation({ code: 'P2002' }, 'checksum')).toBe(false)
  })
})
