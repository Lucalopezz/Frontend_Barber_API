/** A definitive recovery transition produced by this request's own session. */
export class SessionEnded extends Error {
  readonly fromGeneration: string;
  readonly toGeneration: string;
  constructor(cause: unknown, fromGeneration: string, toGeneration: string) {
    super('Sessão encerrada.', { cause });
    this.fromGeneration = fromGeneration;
    this.toGeneration = toGeneration;
  }
}
/** Only created before Axios dispatches its adapter; never inferred from a missing response. */
export class RequestNotSent extends Error {
  readonly requestNotSent = true;
  readonly operationGeneration: string;
  readonly allowedGeneration: string;
  constructor(cause: unknown, generation: string) {
    super('A operação não foi enviada. Recupere a sessão e tente novamente.', { cause });
    this.operationGeneration = generation;
    this.allowedGeneration = cause instanceof SessionEnded && cause.fromGeneration === generation ? cause.toGeneration : generation;
  }
}
