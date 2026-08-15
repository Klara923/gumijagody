export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

type LabelMeta = { label: string; tone: BadgeTone }

function pick<T extends string>(map: Record<T, LabelMeta>, value: T): LabelMeta {
  return map[value] ?? { label: value, tone: 'neutral' }
}

export const DOCUMENT_STAGE = {
  BUFFER: { label: 'Bufor', tone: 'warning' },
  ACCEPTED: { label: 'Rejestr', tone: 'success' },
} as const satisfies Record<string, LabelMeta>

export const DOCUMENT_SOURCE = {
  KSEF: { label: 'KSeF', tone: 'info' },
  UPLOAD: { label: 'Wgrany', tone: 'neutral' },
  MANUAL: { label: 'Ręczny', tone: 'neutral' },
} as const satisfies Record<string, LabelMeta>

export const IMPORT_STATUS = {
  RUNNING: { label: 'W toku', tone: 'warning' },
  SUCCESS: { label: 'Sukces', tone: 'success' },
  FAILED: { label: 'Błąd', tone: 'danger' },
} as const satisfies Record<string, LabelMeta>

export const IMPORT_TRIGGER = {
  MANUAL: { label: 'Ręczny', tone: 'neutral' },
  SCHEDULED: { label: 'Harmonogram', tone: 'info' },
} as const satisfies Record<string, LabelMeta>

export const INVOICE_KIND = {
  COST: { label: 'Kosztowe', tone: 'neutral' },
  SALES: { label: 'Sprzedażowe', tone: 'neutral' },
} as const satisfies Record<string, LabelMeta>

export const DOCUMENT_DIRECTION = {
  RECEIVABLE: { label: 'Należność', tone: 'info' },
  PAYABLE: { label: 'Zobowiązanie', tone: 'warning' },
} as const satisfies Record<string, LabelMeta>

export const ATTACHMENT_KIND = {
  KSEF_XML: { label: 'XML KSeF', tone: 'info' },
  SOURCE_FILE: { label: 'Plik źródłowy', tone: 'neutral' },
} as const satisfies Record<string, LabelMeta>

export function documentStageLabel(value: keyof typeof DOCUMENT_STAGE) {
  return pick(DOCUMENT_STAGE, value).label
}

export function documentSourceLabel(value: keyof typeof DOCUMENT_SOURCE) {
  return pick(DOCUMENT_SOURCE, value).label
}

export type DocumentSource = keyof typeof DOCUMENT_SOURCE

export function importStatusLabel(value: keyof typeof IMPORT_STATUS) {
  return pick(IMPORT_STATUS, value).label
}

export function invoiceKindLabel(value: keyof typeof INVOICE_KIND) {
  return pick(INVOICE_KIND, value).label
}

export function attachmentKindLabel(value: keyof typeof ATTACHMENT_KIND) {
  return pick(ATTACHMENT_KIND, value).label
}
