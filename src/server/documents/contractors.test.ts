import { normalizeContractorName, resolveContractor } from './contractors'

describe('normalizeContractorName', () => {
  it('trims, collapses spaces, and lowercases in Polish', () => {
    expect(normalizeContractorName('  Jan  Kowalski  ')).toBe('jan kowalski')
  })
})

describe('resolveContractor', () => {
  function mockTx(overrides: {
    findMany?: unknown[]
    findUnique?: unknown | null
    createId?: string
    updateId?: string
  }) {
    return {
      contractor: {
        findMany: jest.fn().mockResolvedValue(overrides.findMany ?? []),
        findUnique: jest.fn().mockResolvedValue(overrides.findUnique ?? null),
        create: jest.fn().mockResolvedValue({ id: overrides.createId ?? 'new' }),
        update: jest.fn().mockResolvedValue({ id: overrides.updateId ?? 'existing' }),
      },
    }
  }

  it('reuses an existing contractor without NIP when the name matches', async () => {
    const tx = mockTx({
      findMany: [
        {
          id: 'c1',
          name: 'Jan Kowalski',
          street: 'Ul. A 1',
          postalCode: null,
          city: null,
          country: 'PL',
          bankAccount: null,
        },
      ],
      updateId: 'c1',
    })

    const id = await resolveContractor(tx as never, {
      name: '  jan   kowalski ',
      city: 'Warszawa',
    })

    expect(id).toBe('c1')
    expect(tx.contractor.create).not.toHaveBeenCalled()
    expect(tx.contractor.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c1' },
        data: expect.objectContaining({ city: 'Warszawa' }),
      }),
    )
  })

  it('creates a new contractor without NIP when no name matches', async () => {
    const tx = mockTx({ findMany: [], createId: 'c-new' })

    const id = await resolveContractor(tx as never, { name: 'Nowa Firma' })

    expect(id).toBe('c-new')
    expect(tx.contractor.create).toHaveBeenCalled()
    expect(tx.contractor.update).not.toHaveBeenCalled()
  })

  it('still upserts by NIP when NIP is present', async () => {
    const tx = mockTx({
      findUnique: {
        id: 'c-nip',
        name: 'ABC',
        street: null,
        postalCode: null,
        city: null,
        country: 'PL',
        bankAccount: null,
      },
      updateId: 'c-nip',
    })

    const id = await resolveContractor(tx as never, {
      name: 'ABC Sp. z o.o.',
      nip: '5250001009',
      street: 'Marszałkowska 1',
    })

    expect(id).toBe('c-nip')
    expect(tx.contractor.findUnique).toHaveBeenCalledWith({ where: { nip: '5250001009' } })
    expect(tx.contractor.create).not.toHaveBeenCalled()
  })
})
