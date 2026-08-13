export class DocumentTypeError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'DocumentTypeError'
    this.status = status
  }
}
