function uniqueViolationFields(error: object): string[] {
  const target = (error as { meta?: { target?: unknown } }).meta?.target
  if (Array.isArray(target)) return target.map(String)
  if (typeof target === 'string') return [target]
  return []
}

export function isPrismaUniqueViolation(error: unknown, field?: string): boolean {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('code' in error) ||
    (error as { code: unknown }).code !== 'P2002'
  ) {
    return false
  }
  if (!field) return true
  return uniqueViolationFields(error).some(
    (item) => item === field || item.split(/[_.]/).includes(field),
  )
}
