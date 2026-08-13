import { matchKeywordCategoryId, normalizeKeyword } from '@/server/categories/match-keyword-rule'

describe('normalizeKeyword', () => {
  it('trims, lowercases in Polish, and collapses spaces', () => {
    expect(normalizeKeyword('  ORLEN  S.A.  ')).toBe('orlen s.a.')
    expect(normalizeKeyword('Paliwo')).toBe('paliwo')
  })
})

describe('matchKeywordCategoryId', () => {
  const rules = [
    { keyword: 'orlen', categoryId: 'fuel', priority: 100 },
    { keyword: 'transport', categoryId: 'transport', priority: 50 },
    { keyword: 'opakowan', categoryId: 'packaging', priority: 50 },
  ]

  it('returns null when texts or rules are empty', () => {
    expect(matchKeywordCategoryId([], rules)).toBeNull()
    expect(matchKeywordCategoryId(['ORLEN'], [])).toBeNull()
    expect(matchKeywordCategoryId([null, undefined, ''], rules)).toBeNull()
  })

  it('matches a keyword in the contractor name regardless of case', () => {
    expect(matchKeywordCategoryId(['PKN Orlen S.A.', 'FV/1'], rules)).toBe('fuel')
  })

  it('prefers the lower priority number', () => {
    expect(matchKeywordCategoryId(['Orlen transport'], rules)).toBe('transport')
  })

  it('prefers the longer keyword when priority is equal', () => {
    expect(
      matchKeywordCategoryId(['usługa transportowa'], [
        { keyword: 'trans', categoryId: 'short', priority: 10 },
        { keyword: 'transport', categoryId: 'long', priority: 10 },
      ]),
    ).toBe('long')
  })

  it('does not match a keyword split across fields', () => {
    expect(matchKeywordCategoryId(['or', 'len'], [{ keyword: 'orlen', categoryId: 'fuel', priority: 1 }])).toBeNull()
  })

  it('returns null when nothing matches', () => {
    expect(matchKeywordCategoryId(['Allegro', 'FV/99'], rules)).toBeNull()
  })
})
