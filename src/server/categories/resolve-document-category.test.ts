import { chooseDocumentCategoryId } from './resolve-document-category'

describe('chooseDocumentCategoryId', () => {
  it('prefers an explicit category over contractor default and keyword', () => {
    expect(
      chooseDocumentCategoryId({
        explicitCategoryId: 'explicit',
        contractorDefaultCategoryId: 'contractor',
        keywordCategoryId: 'keyword',
      }),
    ).toBe('explicit')
  })

  it('prefers the contractor default over a keyword match', () => {
    expect(
      chooseDocumentCategoryId({
        contractorDefaultCategoryId: 'contractor',
        keywordCategoryId: 'keyword',
      }),
    ).toBe('contractor')
  })

  it('uses the keyword match when nothing else is set', () => {
    expect(chooseDocumentCategoryId({ keywordCategoryId: 'keyword' })).toBe('keyword')
  })

  it('returns null when no source applies', () => {
    expect(chooseDocumentCategoryId({})).toBeNull()
    expect(
      chooseDocumentCategoryId({
        explicitCategoryId: null,
        contractorDefaultCategoryId: '',
        keywordCategoryId: null,
      }),
    ).toBeNull()
  })
})
