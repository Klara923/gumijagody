'use client'

export function SelectAllCheckbox({ name = 'ids' }: { name?: string }) {
  return (
    <input
      type="checkbox"
      aria-label="Zaznacz wszystkie"
      onChange={(event) => {
        const form = event.currentTarget.form
        if (!form) return
        for (const input of form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)) {
          input.checked = event.currentTarget.checked
        }
      }}
    />
  )
}
