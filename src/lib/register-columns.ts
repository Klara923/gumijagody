import { DOCUMENT_SOURCE, documentSourceLabel } from '@/lib/labels'

export type RegisterDocument = {
  id: string
  number: string
  type: { name: string }
  contractor: { name: string; nip: string | null }
  category: { name: string } | null
  issueDate: string
  dueDate: string | null
  netAmount: string
  vatAmount: string
  grossAmount: string
  currency: string
  source: keyof typeof DOCUMENT_SOURCE
  ksefNumber: string | null
}

export const REGISTER_VIEW = 'documents-register'

export const REGISTER_COLUMNS = [
  { id: 'number', label: 'Numer', defaultVisible: true, value: (doc: RegisterDocument) => doc.number },
  { id: 'type', label: 'Typ', defaultVisible: true, value: (doc: RegisterDocument) => doc.type.name },
  {
    id: 'contractor',
    label: 'Kontrahent',
    defaultVisible: true,
    value: (doc: RegisterDocument) => doc.contractor.name,
  },
  {
    id: 'nip',
    label: 'NIP',
    defaultVisible: false,
    value: (doc: RegisterDocument) => doc.contractor.nip ?? '—',
  },
  {
    id: 'category',
    label: 'Kategoria',
    defaultVisible: true,
    value: (doc: RegisterDocument) => doc.category?.name ?? '—',
  },
  {
    id: 'issueDate',
    label: 'Data wystawienia',
    defaultVisible: true,
    value: (doc: RegisterDocument) => doc.issueDate,
  },
  {
    id: 'dueDate',
    label: 'Termin płatności',
    defaultVisible: false,
    value: (doc: RegisterDocument) => doc.dueDate ?? '—',
  },
  {
    id: 'netAmount',
    label: 'Netto',
    defaultVisible: false,
    value: (doc: RegisterDocument) => `${doc.netAmount} ${doc.currency}`,
  },
  {
    id: 'vatAmount',
    label: 'VAT',
    defaultVisible: false,
    value: (doc: RegisterDocument) => `${doc.vatAmount} ${doc.currency}`,
  },
  {
    id: 'grossAmount',
    label: 'Brutto',
    defaultVisible: true,
    value: (doc: RegisterDocument) => `${doc.grossAmount} ${doc.currency}`,
  },
  {
    id: 'source',
    label: 'Źródło',
    defaultVisible: true,
    value: (doc: RegisterDocument) => documentSourceLabel(doc.source),
  },
  {
    id: 'ksefNumber',
    label: 'Numer KSeF',
    defaultVisible: false,
    value: (doc: RegisterDocument) => doc.ksefNumber ?? '—',
  },
] as const

export type RegisterColumnId = (typeof REGISTER_COLUMNS)[number]['id']

export const REGISTER_COLUMN_IDS = REGISTER_COLUMNS.map((column) => column.id)

export const DEFAULT_VISIBLE_COLUMNS: RegisterColumnId[] = REGISTER_COLUMNS.filter(
  (column) => column.defaultVisible,
).map((column) => column.id)

const allowedIds = new Set<string>(REGISTER_COLUMN_IDS)
const columnsById = new Map(REGISTER_COLUMNS.map((column) => [column.id, column]))

export function resolveVisibleColumns(stored: string[] | null | undefined): RegisterColumnId[] {
  const visible = (stored ?? []).filter((id): id is RegisterColumnId => allowedIds.has(id))
  return visible.length > 0 ? visible : DEFAULT_VISIBLE_COLUMNS
}

export function getRegisterColumn(columnId: RegisterColumnId) {
  const column = columnsById.get(columnId)
  if (!column) throw new Error(`Nieznana kolumna rejestru: ${columnId}`)
  return column
}

export function formatRegisterColumn(document: RegisterDocument, columnId: RegisterColumnId): string {
  return getRegisterColumn(columnId).value(document)
}
