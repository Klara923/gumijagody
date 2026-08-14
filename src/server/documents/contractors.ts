import type { Prisma } from '@/generated/prisma/client'

import { DocumentError } from './errors'

export type ContractorInput = {
  name: string
  nip?: string
  street?: string
  postalCode?: string
  city?: string
  country?: string
  bankAccount?: string
}

type Tx = Prisma.TransactionClient

function fillEmpty(existing: string | null, incoming: string | null | undefined): string | null {
  if (existing && existing.trim() !== '') return existing
  return incoming ?? null
}

export async function resolveContractor(tx: Tx, input: ContractorInput): Promise<string> {
  const nip = input.nip ?? null
  const incoming = {
    name: input.name,
    nip,
    street: input.street ?? null,
    postalCode: input.postalCode ?? null,
    city: input.city ?? null,
    country: input.country ?? 'PL',
    bankAccount: input.bankAccount ?? null,
  }

  if (!nip) {
    const created = await tx.contractor.create({ data: incoming })
    return created.id
  }

  const existing = await tx.contractor.findUnique({ where: { nip } })
  if (!existing) {
    const created = await tx.contractor.create({ data: incoming })
    return created.id
  }

  const updated = await tx.contractor.update({
    where: { id: existing.id },
    data: {
      name: existing.name.trim() !== '' ? existing.name : incoming.name,
      street: fillEmpty(existing.street, incoming.street),
      postalCode: fillEmpty(existing.postalCode, incoming.postalCode),
      city: fillEmpty(existing.city, incoming.city),
      country: existing.country || incoming.country,
      bankAccount: fillEmpty(existing.bankAccount, incoming.bankAccount),
    },
  })

  return updated.id
}

export async function requireContractorId(tx: Tx, contractorId: string): Promise<string> {
  const existing = await tx.contractor.findUnique({ where: { id: contractorId } })
  if (!existing) {
    throw new DocumentError(`Kontrahent o id ${contractorId} nie istnieje`, 400)
  }
  return existing.id
}
