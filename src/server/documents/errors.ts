export class DocumentError extends Error {
  readonly status: number
  readonly details: string[] | undefined

  constructor(message: string, status: number, details?: string[]) {
    super(message)
    this.name = 'DocumentError'
    this.status = status
    this.details = details
  }
}
