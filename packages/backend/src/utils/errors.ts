export class ServiceError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}
