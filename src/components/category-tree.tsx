'use client'

import { useState } from 'react'

import { ConfirmDelete } from '@/components/confirm-delete'
import { buttonSecondaryClassName, controlClassName, textLinkClassName } from '@/components/ui-kit'
import { cn } from '@/lib/utils'
import { deleteCategoryAction, updateCategoryAction } from '@/server/categories/actions'
import type { CategoryNode } from '@/server/categories/list-categories'

function CategoryRow({ node, depth }: { node: CategoryNode; depth: number }) {
  const [editing, setEditing] = useState(false)

  return (
    <li>
      <div
        className="flex min-h-10 items-center gap-3"
        style={{ paddingLeft: depth * 20 }}
      >
        <span
          className={cn(
            'size-1.5 shrink-0 rounded-full',
            depth === 0 ? 'bg-foreground/50' : 'bg-border',
          )}
          aria-hidden
        />
        {editing ? (
          <form action={updateCategoryAction} className="flex min-w-0 flex-1 items-center gap-2">
            <input type="hidden" name="id" value={node.id} />
            <input
              name="name"
              defaultValue={node.name}
              required
              autoFocus
              aria-label={`Nazwa: ${node.name}`}
              className={cn(controlClassName, 'w-auto max-w-sm flex-1')}
            />
            <button type="submit" className={`${buttonSecondaryClassName} shrink-0`}>
              Zapisz
            </button>
            <button
              type="button"
              className={textLinkClassName}
              onClick={() => setEditing(false)}
            >
              Anuluj
            </button>
          </form>
        ) : (
          <>
            <span className="min-w-0 truncate text-sm font-medium text-foreground">{node.name}</span>
            {node.children.length > 0 ? (
              <span className="shrink-0 text-xs text-muted-foreground">{node.children.length}</span>
            ) : null}
            <div className="ml-auto flex shrink-0 items-center gap-3">
              <button type="button" className={textLinkClassName} onClick={() => setEditing(true)}>
                Zmień
              </button>
              <ConfirmDelete
                action={deleteCategoryAction}
                fields={{ id: node.id }}
                title={`Usunąć kategorię „${node.name}”?`}
                description="Nie usuniesz kategorii, która ma podkategorie albo przypisane dokumenty."
                className={`${textLinkClassName} text-destructive hover:text-destructive`}
              />
            </div>
          </>
        )}
      </div>
      {node.children.length > 0 ? (
        <ul>
          {node.children.map((child) => (
            <CategoryRow key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export function CategoryTree({ nodes }: { nodes: CategoryNode[] }) {
  if (nodes.length === 0) {
    return <p className="text-sm text-muted-foreground">Brak kategorii.</p>
  }

  return (
    <ul className="divide-y divide-border/70">
      {nodes.map((node) => (
        <CategoryRow key={node.id} node={node} depth={0} />
      ))}
    </ul>
  )
}
