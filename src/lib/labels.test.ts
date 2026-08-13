import {
  DOCUMENT_SOURCE,
  DOCUMENT_STAGE,
  IMPORT_STATUS,
  documentSourceLabel,
  documentStageLabel,
  importStatusLabel,
} from './labels'

describe('labels', () => {
  it('maps document stage and source to Polish copy', () => {
    expect(documentStageLabel('BUFFER')).toBe('Bufor')
    expect(documentStageLabel('ACCEPTED')).toBe('Rejestr')
    expect(documentSourceLabel('KSEF')).toBe('KSeF')
    expect(documentSourceLabel('UPLOAD')).toBe('Upload')
    expect(documentSourceLabel('MANUAL')).toBe('Ręczny')
  })

  it('maps import status without leaking enum names', () => {
    expect(importStatusLabel('SUCCESS')).toBe('Sukces')
    expect(importStatusLabel('FAILED')).toBe('Błąd')
    expect(importStatusLabel('RUNNING')).toBe('W toku')
    expect(IMPORT_STATUS.SUCCESS.tone).toBe('success')
    expect(DOCUMENT_STAGE.BUFFER.tone).toBe('warning')
    expect(DOCUMENT_SOURCE.KSEF.tone).toBe('info')
  })
})
