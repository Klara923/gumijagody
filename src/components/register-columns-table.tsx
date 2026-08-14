'use client'

import Link from 'next/link'
import { useRef, useState, type DragEvent } from 'react'

import {
  Card,
  CardTitle,
  buttonSecondaryClassName,
  tableClassName,
  tdClassName,
  textLinkClassName,
  thClassName,
  trClassName,
} from '@/components/ui-kit'
import {
  REGISTER_COLUMNS,
  formatRegisterColumn,
  getRegisterColumn,
  moveVisibleColumn,
  reorderVisibleColumn,
  toggleVisibleColumn,
  type RegisterColumnId,
  type RegisterDocument,
} from '@/lib/register-columns'
import { saveRegisterColumnsAction } from '@/server/table-preferences/actions'

const iconButtonClassName = `${buttonSecondaryClassName} h-7 w-7 px-0 text-xs`

function sameColumns(left: RegisterColumnId[], right: RegisterColumnId[]) {
  return left.length === right.length && left.every((id, index) => id === right[index])
}

export function RegisterColumnsTable({
  documents,
  initialVisibleColumns,
}: {
  documents: RegisterDocument[]
  initialVisibleColumns: RegisterColumnId[]
}) {
  const [visibleColumns, setVisibleColumns] = useState(initialVisibleColumns)
  const [error, setError] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<RegisterColumnId | null>(null)
  const visibleColumnsRef = useRef(initialVisibleColumns)
  const desiredRef = useRef(initialVisibleColumns)
  const lastSavedRef = useRef(initialVisibleColumns)
  const saveEpochRef = useRef(0)
  const savingRef = useRef(false)

  function persist(next: RegisterColumnId[]) {
    desiredRef.current = next
    saveEpochRef.current += 1
    if (!savingRef.current) void flushSave()
  }

  async function flushSave() {
    savingRef.current = true
    try {
      while (true) {
        const epoch = saveEpochRef.current
        const snapshot = desiredRef.current
        const result = await saveRegisterColumnsAction(snapshot)
        if (epoch !== saveEpochRef.current) continue
        if (result.error) {
          setError(result.error)
          desiredRef.current = lastSavedRef.current
          visibleColumnsRef.current = lastSavedRef.current
          setVisibleColumns(lastSavedRef.current)
        } else {
          lastSavedRef.current = snapshot
        }
        if (epoch !== saveEpochRef.current) continue
        break
      }
    } finally {
      savingRef.current = false
    }
    if (!sameColumns(desiredRef.current, lastSavedRef.current)) void flushSave()
  }

  function applyColumns(next: RegisterColumnId[]) {
    if (sameColumns(next, visibleColumnsRef.current)) return
    visibleColumnsRef.current = next
    setVisibleColumns(next)
    setError(null)
    persist(next)
  }

  function toggleColumn(columnId: RegisterColumnId, checked: boolean) {
    const next = toggleVisibleColumn(visibleColumnsRef.current, columnId, checked)
    if (!next) {
      setError('Zostaw co najmniej jedną kolumnę')
      return
    }
    applyColumns(next)
  }

  function moveColumn(columnId: RegisterColumnId, direction: -1 | 1) {
    applyColumns(moveVisibleColumn(visibleColumnsRef.current, columnId, direction))
  }

  function dropColumn(columnId: RegisterColumnId, toIndex: number) {
    applyColumns(reorderVisibleColumn(visibleColumnsRef.current, columnId, toIndex))
  }

  function columnDragSourceProps(columnId: RegisterColumnId) {
    return {
      draggable: true as const,
      onDragStart: (event: DragEvent<HTMLElement>) => {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', columnId)
        setDraggingId(columnId)
      },
      onDragEnd: () => setDraggingId(null),
    }
  }

  function columnDropProps(index: number) {
    return {
      onDragOver: (event: DragEvent<HTMLElement>) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        event.preventDefault()
        const from = (draggingId ?? event.dataTransfer.getData('text/plain')) as RegisterColumnId
        if (from) dropColumn(from, index)
        setDraggingId(null)
      },
    }
  }

  const visibleSet = new Set(visibleColumns)
  const hiddenColumns = REGISTER_COLUMNS.filter((column) => !visibleSet.has(column.id))

  return (
    <>
      <Card>
        <CardTitle>Kolumny</CardTitle>
        <p className="mb-3 text-sm text-muted-foreground">
          Widoczne kolumny układaj strzałkami, przeciąganiem na liście albo nagłówkami tabeli.
          Odznacz, żeby ukryć — tabela i zapis zmieniają się od razu.
        </p>
        <ul className="grid gap-1">
          {visibleColumns.map((columnId, index) => {
            const column = getRegisterColumn(columnId)
            return (
              <li
                key={columnId}
                {...columnDropProps(index)}
                className={`flex items-center gap-2 rounded-md px-1 py-1 ${
                  draggingId === columnId ? 'bg-muted/80' : ''
                }`}
              >
                <span
                  {...columnDragSourceProps(columnId)}
                  className="cursor-grab px-1 text-muted-foreground active:cursor-grabbing"
                  aria-hidden
                >
                  ⋮⋮
                </span>
                <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked
                    onChange={(event) => toggleColumn(columnId, event.target.checked)}
                  />
                  <span className="truncate">{column.label}</span>
                </label>
                <button
                  type="button"
                  className={iconButtonClassName}
                  aria-label={`Przesuń ${column.label} w górę`}
                  disabled={index === 0}
                  onClick={() => moveColumn(columnId, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={iconButtonClassName}
                  aria-label={`Przesuń ${column.label} w dół`}
                  disabled={index === visibleColumns.length - 1}
                  onClick={() => moveColumn(columnId, 1)}
                >
                  ↓
                </button>
              </li>
            )
          })}
        </ul>
        {hiddenColumns.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Ukryte</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {hiddenColumns.map((column) => (
                <label key={column.id} className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={(event) => toggleColumn(column.id, event.target.checked)}
                  />
                  {column.label}
                </label>
              ))}
            </div>
          </div>
        ) : null}
        <p className="mt-2 min-h-5 text-sm text-red-700" aria-live="polite">
          {error}
        </p>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className={tableClassName}>
          <thead>
            <tr>
              {visibleColumns.map((columnId, index) => (
                <th
                  key={columnId}
                  {...columnDragSourceProps(columnId)}
                  {...columnDropProps(index)}
                  title="Przeciągnij, aby zmienić kolejność"
                  className={`${thClassName} cursor-grab select-none active:cursor-grabbing ${
                    draggingId === columnId ? 'bg-muted text-foreground/70' : ''
                  }`}
                >
                  {getRegisterColumn(columnId).label}
                </th>
              ))}
              <th className={`${thClassName} w-36`}>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td className={tdClassName} colSpan={visibleColumns.length + 1}>
                  Brak dokumentów w rejestrze. Dodaj ręcznie albo zaakceptuj pozycje z bufora.
                </td>
              </tr>
            ) : (
              documents.map((document) => (
                <tr key={document.id} className={trClassName}>
                  {visibleColumns.map((columnId) => (
                    <td key={columnId} className={`${tdClassName} truncate`}>
                      {formatRegisterColumn(document, columnId)}
                    </td>
                  ))}
                  <td className={`${tdClassName} space-x-3 whitespace-nowrap`}>
                    <Link href={`/documents/${document.id}/preview`} className={textLinkClassName}>
                      Podgląd
                    </Link>
                    <Link href={`/documents/${document.id}`} className={textLinkClassName}>
                      Szczegóły
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </>
  )
}
