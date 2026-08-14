import { isValidBankAccount, isValidNip, normalizeBankAccount, toCents } from '@/server/validation'

describe('isValidNip', () => {
  it('accepts a NIP with a correct checksum', () => {
    expect(isValidNip('7740001454')).toBe(true)
    expect(isValidNip('1111111111')).toBe(true)
  })

  it('accepts spaces and dashes', () => {
    expect(isValidNip('774-000-14-54')).toBe(true)
    expect(isValidNip('774 000 14 54')).toBe(true)
  })

  it('rejects a wrong length or checksum', () => {
    expect(isValidNip('')).toBe(false)
    expect(isValidNip('123')).toBe(false)
    expect(isValidNip('1234567890')).toBe(false)
    expect(isValidNip('7740001455')).toBe(false)
  })
})

describe('isValidBankAccount', () => {
  const nrb = '61109010140000071219812874'
  const iban = `PL${nrb}`

  it('accepts a Polish NRB and the same number as IBAN', () => {
    expect(isValidBankAccount(nrb)).toBe(true)
    expect(isValidBankAccount(iban)).toBe(true)
    expect(isValidBankAccount('61 1090 1014 0000 0712 1981 2874')).toBe(true)
  })

  it('rejects an empty or malformed number', () => {
    expect(isValidBankAccount('')).toBe(false)
    expect(isValidBankAccount('123')).toBe(false)
    expect(isValidBankAccount('00000000000000000000000000')).toBe(false)
  })
})

describe('normalizeBankAccount', () => {
  it('strips spaces and dashes and uppercases the country code', () => {
    expect(normalizeBankAccount('pl61 1090-1014 0000 0712 1981 2874')).toBe(
      'PL61109010140000071219812874',
    )
  })
})

describe('toCents', () => {
  it('converts decimal amounts to integer cents', () => {
    expect(toCents('100.00')).toBe(10000)
    expect(toCents('0.5')).toBe(50)
    expect(toCents('12')).toBe(1200)
    expect(toCents('-1.25')).toBe(-125)
  })

  it('treats gross as net plus VAT in cents', () => {
    expect(toCents('100.00') + toCents('23.00')).toBe(toCents('123.00'))
    expect(toCents('4001.49') + toCents('0')).toBe(toCents('4001.49'))
  })
})
