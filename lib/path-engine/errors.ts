export class PathGenerationError extends Error {
  details?: unknown
  constructor(message: string, details?: unknown) {
    super(message)
    this.name = "PathGenerationError"
    this.details = details
  }
}

export class CycleDetectedError extends PathGenerationError {
  cycle: string[]
  constructor(cycle: string[]) {
    super(`Circular prerequisite detected: ${cycle.join(" -> ")}`)
    this.name = "CycleDetectedError"
    this.cycle = cycle
  }
}
