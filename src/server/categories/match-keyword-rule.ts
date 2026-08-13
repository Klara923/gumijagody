export function normalizeKeyword(value: string): string {
  return value.trim().toLocaleLowerCase('pl').replace(/\s+/g, ' ')
}

export function matchKeywordCategoryId(
  texts: Array<string | null | undefined>,
  rules: Array<{ keyword: string; categoryId: string; priority: number }>,
): string | null {
  const haystack = texts
    .map((text) => (text ? normalizeKeyword(text) : ''))
    .filter(Boolean)
    .join('\n')
  if (!haystack || rules.length === 0) return null

  const ordered = [...rules].sort((left, right) => {
    if (left.priority !== right.priority) return left.priority - right.priority
    return right.keyword.length - left.keyword.length
  })

  for (const rule of ordered) {
    const keyword = normalizeKeyword(rule.keyword)
    if (keyword && haystack.includes(keyword)) return rule.categoryId
  }

  return null
}
