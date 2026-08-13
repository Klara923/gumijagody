import { getPrisma } from '@/server/infrastructure/db/prisma'

export type KeywordRuleRow = {
  id: string
  keyword: string
  priority: number
  category: { id: string; name: string }
}

export async function listKeywordRules(): Promise<KeywordRuleRow[]> {
  const rules = await getPrisma().categoryKeywordRule.findMany({
    select: {
      id: true,
      keyword: true,
      priority: true,
      category: { select: { id: true, name: true } },
    },
    orderBy: [{ priority: 'asc' }, { keyword: 'asc' }],
  })

  return rules
}
