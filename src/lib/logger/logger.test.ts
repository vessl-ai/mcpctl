import { GLOBAL_CONSTANTS } from "../constants";
import { GLOBAL_ENV } from "../env";
import { LoggerBase } from "./logger";

class TestLogger extends LoggerBase {
  verbose(message: string, context?: Record<string, any>): void {}
  info(message: string, context?: Record<string, any>): void {}
  error(message: string, context?: Record<string, any>): void {}
  warn(message: string, context?: Record<string, any>): void {}
  debug(message: string, context?: Record<string, any>): void {}
  withContext(context: string): TestLogger {
    return new TestLogger({
      prefix: this.appendPrefix(this.prefix, context),
      logLevel: this.logLevel,
    });
  }

  // Expose protected method for testing
  public testMaskSecret(message: string): string {
    return this.maskSecret(message);
  }
}

describe("Logger maskSecret tests", () => {
  let logger: TestLogger;
  const originalMaskSecret = GLOBAL_ENV.MASK_SECRET;

  beforeEach(() => {
    logger = new TestLogger();
  });

  afterEach(() => {
    GLOBAL_ENV.MASK_SECRET = originalMaskSecret;
  });

  it("should mask secret when MASK_SECRET is true", () => {
    GLOBAL_ENV.MASK_SECRET = true;
    const message = `This is a ${GLOBAL_CONSTANTS.SECRET_TAG_START}secret123${GLOBAL_CONSTANTS.SECRET_TAG_END} message`;
    const result = logger.testMaskSecret(message);
    expect(result).toBe(`This is a ${GLOBAL_CONSTANTS.SECRET_MASK} message`);
  });

  it("should remove secret tags when MASK_SECRET is false", () => {
    GLOBAL_ENV.MASK_SECRET = false;
    const message = `This is a ${GLOBAL_CONSTANTS.SECRET_TAG_START}secret123${GLOBAL_CONSTANTS.SECRET_TAG_END} message`;
    const result = logger.testMaskSecret(message);
    expect(result).toBe("This is a secret123 message");
  });

  it("should handle multiple secrets in one message when masking", () => {
    GLOBAL_ENV.MASK_SECRET = true;
    const message = `First ${GLOBAL_CONSTANTS.SECRET_TAG_START}secret1${GLOBAL_CONSTANTS.SECRET_TAG_END} and second ${GLOBAL_CONSTANTS.SECRET_TAG_START}secret2${GLOBAL_CONSTANTS.SECRET_TAG_END}`;
    const result = logger.testMaskSecret(message);
    expect(result).toBe(
      `First ${GLOBAL_CONSTANTS.SECRET_MASK} and second ${GLOBAL_CONSTANTS.SECRET_MASK}`
    );
  });

  it("should not modify message without secret tags", () => {
    GLOBAL_ENV.MASK_SECRET = true;
    const message = "This is a normal message";
    const result = logger.testMaskSecret(message);
    expect(result).toBe(message);
  });

  it("should handle incomplete secret tags", () => {
    GLOBAL_ENV.MASK_SECRET = true;
    const message = `Incomplete ${GLOBAL_CONSTANTS.SECRET_TAG_START}secret`;
    const result = logger.testMaskSecret(message);
    expect(result).toBe("Incomplete secret");
  });
});
