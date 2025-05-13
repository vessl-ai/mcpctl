// import { GLOBAL_CONSTANTS } from "../config/global";
// import { GLOBAL_ENV } from "../env/env";
// import { Logger, LoggerBase, LogLevel } from "./logger";
// import { maskSecret } from "./utils";

// class TestLogger extends LoggerBase implements Logger {
//   constructor() {
//     super({
//       prefix: "test",
//       logLevel: LogLevel.INFO,
//     });
//   }

//   verbose(message: string, ...args: any[]): void {
//     if (this.isLogLevelEnabled(LogLevel.VERBOSE, this.logLevel)) {
//       console.log(
//         `[VERBOSE] ${this.appendPrefix(this.prefix, "")} ${message}`,
//         ...args
//       );
//     }
//   }

//   info(message: string, ...args: any[]): void {
//     if (this.isLogLevelEnabled(LogLevel.INFO, this.logLevel)) {
//       console.info(
//         `[INFO] ${this.appendPrefix(this.prefix, "")} ${message}`,
//         ...args
//       );
//     }
//   }

//   error(message: string, ...args: any[]): void {
//     if (this.isLogLevelEnabled(LogLevel.ERROR, this.logLevel)) {
//       console.error(
//         `[ERROR] ${this.appendPrefix(this.prefix, "")} ${message}`,
//         ...args
//       );
//     }
//   }

//   warn(message: string, ...args: any[]): void {
//     if (this.isLogLevelEnabled(LogLevel.WARN, this.logLevel)) {
//       console.warn(
//         `[WARN] ${this.appendPrefix(this.prefix, "")} ${message}`,
//         ...args
//       );
//     }
//   }

//   debug(message: string, ...args: any[]): void {
//     if (this.isLogLevelEnabled(LogLevel.DEBUG, this.logLevel)) {
//       console.debug(
//         `[DEBUG] ${this.appendPrefix(this.prefix, "")} ${message}`,
//         ...args
//       );
//     }
//   }

//   withContext(context: string): Logger {
//     return new TestLogger();
//   }

//   // Expose protected method for testing
//   public testMaskSecret(message: string): string {
//     return maskSecret(message);
//   }
// }

// describe("Logger", () => {
//   let logger: Logger;

//   beforeEach(() => {
//     logger = new TestLogger();
//   });

//   it("should log verbose messages", () => {
//     const spy = jest.spyOn(console, "log");
//     logger.verbose("test message");
//     expect(spy).toHaveBeenCalledWith(
//       expect.stringContaining("[VERBOSE] test test message")
//     );
//   });

//   it("should log info messages", () => {
//     const spy = jest.spyOn(console, "info");
//     logger.info("test message");
//     expect(spy).toHaveBeenCalledWith(
//       expect.stringContaining("[INFO] test test message")
//     );
//   });

//   it("should log error messages", () => {
//     const spy = jest.spyOn(console, "error");
//     logger.error("test message");
//     expect(spy).toHaveBeenCalledWith(
//       expect.stringContaining("[ERROR] test test message")
//     );
//   });

//   it("should log warn messages", () => {
//     const spy = jest.spyOn(console, "warn");
//     logger.warn("test message");
//     expect(spy).toHaveBeenCalledWith(
//       expect.stringContaining("[WARN] test test message")
//     );
//   });

//   it("should log debug messages", () => {
//     const spy = jest.spyOn(console, "debug");
//     logger.debug("test message");
//     expect(spy).toHaveBeenCalledWith(
//       expect.stringContaining("[DEBUG] test test message")
//     );
//   });

//   it("should create logger with context", () => {
//     const contextLogger = logger.withContext("context");
//     const spy = jest.spyOn(console, "info");
//     contextLogger.info("test message");
//     expect(spy).toHaveBeenCalledWith(
//       expect.stringContaining("[INFO] test:context test message")
//     );
//   });
// });

// describe("Logger maskSecret tests", () => {
//   let logger: TestLogger;
//   const originalMaskSecret = GLOBAL_ENV.MASK_SECRET;

//   beforeEach(() => {
//     logger = new TestLogger();
//   });

//   afterEach(() => {
//     GLOBAL_ENV.MASK_SECRET = originalMaskSecret;
//   });

//   it("should mask secret when MASK_SECRET is true", () => {
//     GLOBAL_ENV.MASK_SECRET = true;
//     const message = `This is a ${GLOBAL_CONSTANTS.SECRET_TAG_START}secret123${GLOBAL_CONSTANTS.SECRET_TAG_END} message`;
//     const result = logger.testMaskSecret(message);
//     expect(result).toBe(`This is a ${GLOBAL_CONSTANTS.SECRET_MASK} message`);
//   });

//   it("should remove secret tags when MASK_SECRET is false", () => {
//     GLOBAL_ENV.MASK_SECRET = false;
//     const message = `This is a ${GLOBAL_CONSTANTS.SECRET_TAG_START}secret123${GLOBAL_CONSTANTS.SECRET_TAG_END} message`;
//     const result = logger.testMaskSecret(message);
//     expect(result).toBe("This is a secret123 message");
//   });

//   it("should handle multiple secrets in one message when masking", () => {
//     GLOBAL_ENV.MASK_SECRET = true;
//     const message = `First ${GLOBAL_CONSTANTS.SECRET_TAG_START}secret1${GLOBAL_CONSTANTS.SECRET_TAG_END} and second ${GLOBAL_CONSTANTS.SECRET_TAG_START}secret2${GLOBAL_CONSTANTS.SECRET_TAG_END}`;
//     const result = logger.testMaskSecret(message);
//     expect(result).toBe(
//       `First ${GLOBAL_CONSTANTS.SECRET_MASK} and second ${GLOBAL_CONSTANTS.SECRET_MASK}`
//     );
//   });

//   it("should not modify message without secret tags", () => {
//     GLOBAL_ENV.MASK_SECRET = true;
//     const message = "This is a normal message";
//     const result = logger.testMaskSecret(message);
//     expect(result).toBe(message);
//   });

//   it("should handle incomplete secret tags", () => {
//     GLOBAL_ENV.MASK_SECRET = true;
//     const message = `Incomplete ${GLOBAL_CONSTANTS.SECRET_TAG_START}secret`;
//     const result = logger.testMaskSecret(message);
//     expect(result).toBe("Incomplete secret");
//   });

//   it("should mask secrets in messages", () => {
//     const message = "This is a secret: <SECRET>password</SECRET>";
//     const masked = maskSecret(message);
//     expect(masked).toBe("This is a secret: ********");
//   });

//   it("should not mask non-secret messages", () => {
//     const message = "This is not a secret";
//     const masked = maskSecret(message);
//     expect(masked).toBe(message);
//   });
// });
