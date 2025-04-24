export class CliError extends Error {
  constructor(
    message: string,
    public error?: any,
    public exitCode: number = 1
  ) {
    super(message);
    this.name = 'CliError';
  }
}

export class ValidationError extends CliError {
  constructor(message: string, error?: any) {
    super(message, error);
    this.name = 'ValidationError';
  }
}

export class ResourceNotFoundError extends CliError {
  constructor(message: string, error?: any) {
    super(message, error);
    this.name = 'ResourceNotFoundError';
  }
}
