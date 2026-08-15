'use client'

import { useState } from 'react'

import { Field, buttonSecondaryClassName, fieldControlClassName } from '@/components/ui-kit'

type LookupResult = {
  name: string
  nip: string
  street: string | null
  postalCode: string | null
  city: string | null
  bankAccount: string | null
  statusVat: string | null
}

export function ContractorLookupFields({
  requiredName = false,
  errors = {},
  values = {},
}: {
  requiredName?: boolean
  errors?: Record<string, string>
  values?: Record<string, string>
}) {
  const [nip, setNip] = useState(values.contractorNip ?? '')
  const [name, setName] = useState(values.contractorName ?? '')
  const [street, setStreet] = useState(values.contractorStreet ?? '')
  const [postalCode, setPostalCode] = useState(values.contractorPostalCode ?? '')
  const [city, setCity] = useState(values.contractorCity ?? '')
  const [bankAccount, setBankAccount] = useState(values.contractorBankAccount ?? '')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [whitelist, setWhitelist] = useState<string | null>(null)
  const [whitelistOk, setWhitelistOk] = useState<boolean | null>(null)
  const [pending, setPending] = useState(false)
  const [checking, setChecking] = useState(false)

  async function lookup() {
    setError(null)
    setStatus(null)
    setPending(true)
    try {
      const response = await fetch(`/api/contractors/lookup?nip=${encodeURIComponent(nip)}`)
      const payload = (await response.json()) as LookupResult & { error?: string }
      if (!response.ok) {
        setError(payload.error ?? 'Nie udało się pobrać danych z wykazu')
        return
      }
      setNip(payload.nip)
      setName(payload.name)
      setStreet(payload.street ?? '')
      setPostalCode(payload.postalCode ?? '')
      setCity(payload.city ?? '')
      setBankAccount(payload.bankAccount ?? '')
      setWhitelist(null)
      setWhitelistOk(null)
      setStatus(
        payload.statusVat
          ? `Uzupełniono z wykazu VAT (${payload.statusVat}).`
          : 'Uzupełniono z wykazu podatników VAT.',
      )
    } catch {
      setError('Nie udało się połączyć z serwerem')
    } finally {
      setPending(false)
    }
  }

  async function checkWhitelist() {
    setWhitelist(null)
    setWhitelistOk(null)
    setChecking(true)
    try {
      const params = new URLSearchParams({ nip, account: bankAccount })
      const response = await fetch(`/api/contractors/whitelist?${params.toString()}`)
      const payload = (await response.json()) as {
        matched?: boolean
        requestId?: string | null
        error?: string
      }
      if (!response.ok) {
        setWhitelistOk(false)
        setWhitelist(payload.error ?? 'Nie udało się sprawdzić białej listy')
        return
      }
      setWhitelistOk(payload.matched === true)
      setWhitelist(
        payload.matched
          ? `Rachunek jest na białej liście VAT dla tego NIP${payload.requestId ? ` (id ${payload.requestId})` : ''}.`
          : `Tego rachunku nie ma na białej liście VAT dla tego NIP${payload.requestId ? ` (id ${payload.requestId})` : ''}.`,
      )
    } catch {
      setWhitelistOk(false)
      setWhitelist('Nie udało się połączyć z serwerem')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="grid gap-3">
      <Field label="Kontrahent — NIP" error={errors.contractorNip}>
        <div className="flex gap-2">
          <input
            name="contractorNip"
            value={nip}
            onChange={(event) => setNip(event.target.value)}
            inputMode="numeric"
            autoComplete="off"
            placeholder="10 cyfr"
            aria-invalid={Boolean(errors.contractorNip)}
            className={`${fieldControlClassName(Boolean(errors.contractorNip))} min-w-0 flex-1`}
          />
          <button
            type="button"
            onClick={() => void lookup()}
            disabled={pending}
            className={buttonSecondaryClassName}
          >
            {pending ? 'Szukam…' : 'Pobierz z wykazu'}
          </button>
        </div>
      </Field>
      <p
        className={`min-h-5 text-sm ${error ? 'text-red-700' : 'text-emerald-800'}`}
        aria-live="polite"
      >
        {error ?? status}
      </p>
      <Field label="Kontrahent — nazwa" error={errors.contractorName}>
        <input
          name="contractorName"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required={requiredName}
          aria-invalid={Boolean(errors.contractorName)}
          className={fieldControlClassName(Boolean(errors.contractorName))}
        />
      </Field>
      <Field label="Ulica (opcjonalnie)" error={errors.contractorStreet}>
        <input
          name="contractorStreet"
          value={street}
          onChange={(event) => setStreet(event.target.value)}
          aria-invalid={Boolean(errors.contractorStreet)}
          className={fieldControlClassName(Boolean(errors.contractorStreet))}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Kod pocztowy (opcjonalnie)" error={errors.contractorPostalCode}>
          <input
            name="contractorPostalCode"
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
            placeholder="00-000"
            aria-invalid={Boolean(errors.contractorPostalCode)}
            className={fieldControlClassName(Boolean(errors.contractorPostalCode))}
          />
        </Field>
        <Field label="Miasto (opcjonalnie)" error={errors.contractorCity}>
          <input
            name="contractorCity"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            aria-invalid={Boolean(errors.contractorCity)}
            className={fieldControlClassName(Boolean(errors.contractorCity))}
          />
        </Field>
      </div>
      <Field label="Rachunek kontrahenta (opcjonalnie)" error={errors.contractorBankAccount}>
        <div className="flex gap-2">
          <input
            name="contractorBankAccount"
            value={bankAccount}
            onChange={(event) => {
              setBankAccount(event.target.value)
              setWhitelist(null)
              setWhitelistOk(null)
            }}
            aria-invalid={Boolean(errors.contractorBankAccount)}
            className={`${fieldControlClassName(Boolean(errors.contractorBankAccount))} min-w-0 flex-1`}
          />
          <button
            type="button"
            onClick={() => void checkWhitelist()}
            disabled={checking}
            className={buttonSecondaryClassName}
          >
            {checking ? 'Sprawdzam…' : 'Sprawdź na białej liście'}
          </button>
        </div>
        <p
          className={`min-h-5 text-sm ${whitelistOk ? 'text-emerald-800' : 'text-red-700'}`}
          aria-live="polite"
        >
          {whitelist}
        </p>
      </Field>
    </div>
  )
}
