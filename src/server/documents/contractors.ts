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

export function normalizeContractorName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pl')
}

function fillEmpty(existing: string | null, incoming: string | null | undefined): string | null {
  if (existing && existing.trim() !== '') return existing
  return incoming ?? null
}

async function updateExistingContractor(
  tx: Tx,
  existing: {
    id: string
    name: string
    street: string | null
    postalCode: string | null
    city: string | null
    country: string
    bankAccount: string | null
  },
  incoming: {
    name: string
    street: string | null
    postalCode: string | null
    city: string | null
    country: string
    bankAccount: string | null
  },
): Promise<string> {
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

export async function resolveContractor(tx: Tx, input: ContractorInput): Promise<string> {
  const nip = input.nip ?? null
  const name = input.name.trim().replace(/\s+/g, ' ')
  const incoming = {
    name,
    nip,
    street: input.street ?? null,
    postalCode: input.postalCode ?? null,
    city: input.city ?? null,
    country: input.country ?? 'PL',
    bankAccount: input.bankAccount ?? null,
  }

  if (!nip) {
    const normalized = normalizeContractorName(name)
    const candidates = await tx.contractor.findMany({
      where: { nip: null },
      select: {
        id: true,
        name: true,
        street: true,
        postalCode: true,
        city: true,
        country: true,
        bankAccount: true,
      },
    })
    const existing = candidates.find(
      (candidate) => normalizeContractorName(candidate.name) === normalized,
    )

    if (existing) {
      return updateExistingContractor(tx, existing, incoming)
    }

    const created = await tx.contractor.create({ data: incoming })
    return created.id
  }

  const existing = await tx.contractor.findUnique({ where: { nip } })
  if (!existing) {
    const created = await tx.contractor.create({ data: incoming })
    return created.id
  }

  return updateExistingContractor(tx, existing, incoming)
}

export async function requireContractorId(tx: Tx, contractorId: string): Promise<string> {
  const existing = await tx.contractor.findUnique({ where: { id: contractorId } })
  if (!existing) {
    throw new DocumentError(`Kontrahent o id ${contractorId} nie istnieje`, 400)
  }
  return existing.id
}
