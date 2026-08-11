const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7]

export function isValidNip(value: string): boolean {
  const digits = value.replace(/[\s-]/g, '')
  if (!/^\d{10}$/.test(digits)) return false

  const checksum =
    NIP_WEIGHTS.reduce((sum, weight, index) => sum + weight * Number(digits[index]), 0) % 11

  return checksum !== 10 && checksum === Number(digits[9])
}

export function normalizeBankAccount(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase()
}

export function isValidBankAccount(value: string): boolean {
  const normalized = normalizeBankAccount(value)
  const iban = /^\d{26}$/.test(normalized) ? `PL${normalized}` : normalized

  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false

  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`

  let remainder = 0
  for (const character of rearranged) {
    const chunk = /\d/.test(character) ? character : String(character.charCodeAt(0) - 55)
    for (const digit of chunk) {
      remainder = (remainder * 10 + Number(digit)) % 97
    }
  }

  return remainder === 1
}

export function toCents(amount: string): number {
  const [whole = '0', fraction = ''] = amount.split('.')
  const sign = whole.startsWith('-') ? -1 : 1

  return sign * (Number(whole.replace('-', '')) * 100 + Number(fraction.padEnd(2, '0')))
}
