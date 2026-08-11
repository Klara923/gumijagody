import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '../src/generated/prisma/client'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

const systemTypes = [
  { name: 'Faktura sprzedażowa', direction: 'RECEIVABLE' as const },
  { name: 'Faktura kosztowa', direction: 'PAYABLE' as const },
]

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

  console.log(`Seed: ${systemTypes.length} typy systemowe dokumentów`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
