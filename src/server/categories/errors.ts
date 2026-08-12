export class CategoryError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'CategoryError'
    this.status = status
  }
}
