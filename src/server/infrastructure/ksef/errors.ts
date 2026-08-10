/**
 * Błąd integracji z KSeF. Niesie kod HTTP oraz kod statusu KSeF, bo dopiero ich kombinacja
 * pozwala odróżnić przypadki, które trzeba obsłużyć inaczej: ponowić, odświeżyć token
 * albo pokazać użytkownikowi konkretną przyczynę.
 */
export class KsefError extends Error {
  readonly httpStatus?: number
  readonly ksefCode?: number
  readonly details?: string[]

  constructor(
    message: string,
    options: { httpStatus?: number; ksefCode?: number; details?: string[]; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause })
    this.name = 'KsefError'
    this.httpStatus = options.httpStatus
    this.ksefCode = options.ksefCode
    this.details = options.details
  }
}

/** Kody statusu operacji uwierzytelnienia zwracane przez GET /auth/{referenceNumber}. */
export const AUTH_STATUS = {
  IN_PROGRESS: 100,
  SUCCESS: 200,
  NO_PERMISSIONS: 415,
  REVOKED: 425,
  INVALID_TOKEN: 450,
} as const

/**
 * Tłumaczy kod statusu na wskazówkę, co konkretnie zrobić - opis z API mówi *co* się stało,
 * ale nie *dlaczego*, a przyczyna jest prawie zawsze ta sama i łatwa do wskazania.
 */
export function explainAuthStatus(code: number): string | undefined {
  switch (code) {
    case AUTH_STATUS.NO_PERMISSIONS:
      return 'Token jest poprawny, ale nie ma uprawnień w tym kontekście. Sprawdź, czy KSEF_NIP zgadza się z NIP-em, dla którego wygenerowano token, oraz czy token ma uprawnienie "przeglądanie faktur".'
    case AUTH_STATUS.INVALID_TOKEN:
      // Ten sam kod 450 obejmuje kilka różnych przyczyn, a rozróżnia je dopiero pole `details`
      // z odpowiedzi - dlatego wskazówka wymienia je wszystkie, zamiast zgadywać jedną.
      return [
        'KSeF odrzucił token. Sprawdź kolejno:',
        '  - czy KSEF_NIP to dokładnie ten NIP, na który byłaś zalogowana przy generowaniu tokena',
        '    (komunikat "nie może być użyty w kontekście" oznacza właśnie tę rozbieżność),',
        '  - czy token został skopiowany w całości,',
        '  - czy pochodzi z tego samego środowiska co KSEF_API_BASE_URL.',
      ].join('\n')
    case AUTH_STATUS.REVOKED:
      return 'Uwierzytelnienie zostało unieważnione. Wygeneruj nowy token w Aplikacji Podatnika.'
    default:
      return undefined
  }
}
