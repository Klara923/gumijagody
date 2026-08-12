import { getPrisma } from '@/server/infrastructure/db/prisma'

export type CategoryNode = {
  id: string
  name: string
  parentId: string | null
  children: CategoryNode[]
}

export type CategoryOption = {
  id: string
  name: string
  label: string
  parentId: string | null
  depth: number
}

function buildTree(
  categories: Array<{ id: string; name: string; parentId: string | null }>,
): CategoryNode[] {
  const byParent = new Map<string | null, typeof categories>()
  for (const category of categories) {
    const key = category.parentId
    const bucket = byParent.get(key) ?? []
    bucket.push(category)
    byParent.set(key, bucket)
  }

  const walk = (parentId: string | null): CategoryNode[] =>
    (byParent.get(parentId) ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'pl'))
      .map((category) => ({
        id: category.id,
        name: category.name,
        parentId: category.parentId,
        children: walk(category.id),
      }))

  return walk(null)
}

export async function listCategoryTree(): Promise<CategoryNode[]> {
  const categories = await getPrisma().category.findMany({
    select: { id: true, name: true, parentId: true },
  })
  return buildTree(categories)
}

export async function listCategoryOptions(): Promise<CategoryOption[]> {
  const tree = await listCategoryTree()
  const options: CategoryOption[] = []

  const walk = (nodes: CategoryNode[], depth: number, prefix: string) => {
    for (const node of nodes) {
      const label = prefix ? `${prefix} / ${node.name}` : node.name
      options.push({
        id: node.id,
        name: node.name,
        label,
        parentId: node.parentId,
        depth,
      })
      walk(node.children, depth + 1, label)
    }
  }

  walk(tree, 0, '')
  return options
}
