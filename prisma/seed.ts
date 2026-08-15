import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient, type Prisma } from '../src/generated/prisma/client'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

const systemTypes = [
  { name: 'Faktura sprzedażowa', direction: 'RECEIVABLE' as const },
  { name: 'Faktura kosztowa', direction: 'PAYABLE' as const },
]

async function ensureCategory(name: string, parentId: string | null = null) {
  const existing = await prisma.category.findFirst({
    where: { name, parentId },
  })
  if (existing) return existing
  return prisma.category.create({
    data: { name, parentId },
  })
}

async function ensureContractor(input: {
  name: string
  nip: string
  defaultCategoryId?: string | null
}) {
  return prisma.contractor.upsert({
    where: { nip: input.nip },
    create: {
      name: input.name,
      nip: input.nip,
      defaultCategoryId: input.defaultCategoryId ?? null,
    },
    update: {
      name: input.name,
      defaultCategoryId: input.defaultCategoryId ?? null,
    },
  })
}

async function ensureDocument(
  input: Prisma.DocumentUncheckedCreateInput & {
    attachment?: Omit<Prisma.AttachmentUncheckedCreateInput, 'documentId'>
  },
) {
  const existing = input.ksefNumber
    ? await prisma.document.findUnique({ where: { ksefNumber: input.ksefNumber } })
    : await prisma.document.findFirst({
        where: { number: input.number, contractorId: input.contractorId },
      })
  if (existing) return existing

  const { attachment, ...document } = input
  const created = await prisma.document.create({ data: document })
  if (attachment) {
    await prisma.attachment.create({
      data: { ...attachment, documentId: created.id },
    })
  }
  return created
}

async function main() {
  for (const type of systemTypes) {
    await prisma.documentType.upsert({
      where: { name: type.name },
      create: {
        name: type.name,
        direction: type.direction,
        isSystem: true,
      },
      update: {
        direction: type.direction,
        isSystem: true,
      },
    })
  }

  const payable = await prisma.documentType.findUniqueOrThrow({
    where: { name: 'Faktura kosztowa' },
  })

  console.log(`Seed: ${systemTypes.length} typy systemowe dokumentów`)

  const materials = await ensureCategory('Materiały')
  const services = await ensureCategory('Usługi')
  const packaging = await ensureCategory('Opakowania', materials.id)
  const transport = await ensureCategory('Transport', services.id)

  console.log('Seed: przykładowe drzewo kategorii (Materiały/Opakowania, Usługi/Transport)')

  const keywordRules = [
    { keyword: 'transport', categoryId: transport.id, priority: 50 },
    { keyword: 'opakowan', categoryId: packaging.id, priority: 50 },
  ]

  for (const rule of keywordRules) {
    await prisma.categoryKeywordRule.upsert({
      where: { keyword: rule.keyword },
      create: rule,
      update: { categoryId: rule.categoryId, priority: rule.priority },
    })
  }

  console.log('Seed: przykładowe reguły słów kluczowych (transport, opakowan)')

  const orlen = await ensureContractor({
    name: 'ORLEN SPÓŁKA AKCYJNA',
    nip: '7740001454',
    defaultCategoryId: materials.id,
  })
  const carrier = await ensureContractor({
    name: 'Trans-Bud Transport Sp. z o.o.',
    nip: '1111111111',
    defaultCategoryId: null,
  })
  const abcAgd = await ensureContractor({
    name: 'ABC AGD sp. z o. o.',
    nip: '9781399259',
  })

  const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), '../fixtures/ksef')
  const fa2 = (await readFile(join(fixtureDir, 'FA2.xml'), 'utf8'))
    .replace('<P_1>2023-08-31</P_1>', '<P_1>2026-08-14</P_1>')
    .replace('<P_2>FK2023/08/31</P_2>', '<P_2>FK-SEED/FA2</P_2>')
  const fa2Bytes = Buffer.from(fa2, 'utf8')

  await ensureDocument({
    number: 'FV/SEED/RECZNY/001',
    typeId: payable.id,
    contractorId: orlen.id,
    issueDate: new Date('2026-08-10T00:00:00.000Z'),
    dueDate: new Date('2026-08-24T00:00:00.000Z'),
    netAmount: '1000.00',
    vatAmount: '230.00',
    grossAmount: '1230.00',
    currency: 'PLN',
    categoryId: materials.id,
    source: 'MANUAL',
    stage: 'ACCEPTED',
    acceptedAt: new Date('2026-08-11T00:00:00.000Z'),
  })

  await ensureDocument({
    number: 'FK-SEED/FA2',
    typeId: payable.id,
    contractorId: abcAgd.id,
    issueDate: new Date('2026-08-14T00:00:00.000Z'),
    netAmount: '4001.49',
    vatAmount: '0.00',
    grossAmount: '4001.49',
    currency: 'PLN',
    source: 'UPLOAD',
    stage: 'BUFFER',
    attachment: {
      kind: 'KSEF_XML',
      filename: 'FA2.xml',
      mimeType: 'application/xml',
      sizeBytes: fa2Bytes.byteLength,
      checksum: createHash('sha256').update(fa2Bytes).digest('hex'),
      content: Uint8Array.from(fa2Bytes),
    },
  })

  await ensureDocument({
    number: 'FV/SEED/KSEF/001',
    typeId: payable.id,
    contractorId: carrier.id,
    issueDate: new Date('2026-08-12T00:00:00.000Z'),
    dueDate: new Date('2026-08-26T00:00:00.000Z'),
    netAmount: '100.00',
    vatAmount: '23.00',
    grossAmount: '123.00',
    currency: 'PLN',
    categoryId: transport.id,
    source: 'KSEF',
    stage: 'ACCEPTED',
    acceptedAt: new Date('2026-08-13T00:00:00.000Z'),
    ksefNumber: 'SEED-KSEF-001',
  })

  console.log('Seed: demo — Orlen (rejestr), XML FA2 (bufor), KSeF + transport (rejestr)')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
