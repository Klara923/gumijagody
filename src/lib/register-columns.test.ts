import {
  DEFAULT_VISIBLE_COLUMNS,
  moveVisibleColumn,
  reorderVisibleColumn,
  resolveVisibleColumns,
  toggleVisibleColumn,
} from './register-columns'

describe('register columns', () => {
  it('keeps stored order and drops unknown or duplicate ids', () => {
    expect(resolveVisibleColumns(['grossAmount', 'number', 'number', 'nope'])).toEqual([
      'grossAmount',
      'number',
    ])
  })

  it('falls back to defaults when nothing valid is stored', () => {
    expect(resolveVisibleColumns([])).toEqual(DEFAULT_VISIBLE_COLUMNS)
  })

  it('appends a shown column instead of resetting catalog order', () => {
    expect(toggleVisibleColumn(['grossAmount', 'number'], 'nip', true)).toEqual([
      'grossAmount',
      'number',
      'nip',
    ])
  })

  it('refuses to hide the last column', () => {
    expect(toggleVisibleColumn(['number'], 'number', false)).toBeNull()
  })

  it('moves a visible column up and down', () => {
    expect(moveVisibleColumn(['number', 'type', 'contractor'], 'type', -1)).toEqual([
      'type',
      'number',
      'contractor',
    ])
    expect(moveVisibleColumn(['number', 'type', 'contractor'], 'type', 1)).toEqual([
      'number',
      'contractor',
      'type',
    ])
    expect(moveVisibleColumn(['number', 'type'], 'number', -1)).toEqual(['number', 'type'])
  })

  it('reorders by drop index', () => {
    expect(reorderVisibleColumn(['number', 'type', 'contractor'], 'contractor', 0)).toEqual([
      'contractor',
      'number',
      'type',
    ])
  })
})
