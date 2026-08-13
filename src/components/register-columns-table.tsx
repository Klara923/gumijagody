'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'

import { tableClassName, tdClassName, thClassName } from '@/components/ui-kit'
import { saveRegisterColumnsAction } from '@/server/table-preferences/actions'
import {
  REGISTER_COLUMNS,
  formatRegisterColumn,
  getRegisterColumn,
  type RegisterColumnId,
  type RegisterDocument,
} from '@/server/table-preferences/register-columns'

function sameColumns(left: RegisterColumnId[], right: RegisterColumnId[]) {
  return left.length === right.length && left.every((id, index) => id === right[index])
}

function nextVisibleColumns(
  current: RegisterColumnId[],
  columnId: RegisterColumnId,
  checked: boolean,
): RegisterColumnId[] | null {
  const next = checked
    ? REGISTER_COLUMNS.map((column) => column.id).filter(
        (id) => id === columnId || current.includes(id),
      )
    : current.filter((id) => id !== columnId)
  return next.length === 0 ? null : next
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

  function toggleColumn(columnId: RegisterColumnId, checked: boolean) {
    const next = nextVisibleColumns(visibleColumnsRef.current, columnId, checked)
    if (!next) {
      setError('Zostaw co najmniej jedną kolumnę')
      return
    }

    visibleColumnsRef.current = next
    setVisibleColumns(next)
    setError(null)
    persist(next)
  }

  const visibleSet = new Set(visibleColumns)

  return (
    <>
      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-semibold text-zinc-900">Kolumny</h2>
        <p className="mb-3 text-sm text-zinc-600">
          Zaznacz lub odznacz kolumnę — tabela zmienia się od razu. Ustawienie zapisuje się samo.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {REGISTER_COLUMNS.map((column) => (
            <label key={column.id} className="flex items-center gap-2 text-sm text-zinc-800">
              <input
                type="checkbox"
                checked={visibleSet.has(column.id)}
                onChange={(event) => toggleColumn(column.id, event.target.checked)}
              />
              {column.label}
            </label>
          ))}
        </div>
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      </section>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className={tableClassName}>
          <thead>
            <tr>
              {visibleColumns.map((columnId) => (
                <th key={columnId} className={thClassName}>
                  {getRegisterColumn(columnId).label}
                </th>
              ))}
              <th className={thClassName}></th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td className={tdClassName} colSpan={visibleColumns.length + 1}>
                  Brak dokumentów w rejestrze
                </td>
              </tr>
            ) : (
              documents.map((document) => (
                <tr key={document.id}>
                  {visibleColumns.map((columnId) => (
                    <td key={columnId} className={tdClassName}>
                      {formatRegisterColumn(document, columnId)}
                    </td>
                  ))}
                  <td className={`${tdClassName} space-x-2 whitespace-nowrap`}>
                    <Link href={`/documents/${document.id}/preview`} className="underline">
                      Podgląd
                    </Link>
                    <Link href={`/documents/${document.id}`} className="underline">
                      Szczegóły
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
