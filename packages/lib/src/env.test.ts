describe("GLOBAL_ENV.MASK_SECRET", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  describe("when MASK_SECRET environment variable is set", () => {
    it('should return true when MASK_SECRET is "true"', () => {
      process.env.MASK_SECRET = "true";
      const { GLOBAL_ENV } = require("./env");
      expect(GLOBAL_ENV.MASK_SECRET).toBe(true);
    });

    it('should return false when MASK_SECRET is "false"', () => {
      process.env.MASK_SECRET = "false";
      const { GLOBAL_ENV } = require("./env");
      expect(GLOBAL_ENV.MASK_SECRET).toBe(false);
    });
  });

  describe("when MASK_SECRET is not set", () => {
    it("should return false when NODE_ENV is development", () => {
      process.env.NODE_ENV = "development";
      delete process.env.MASK_SECRET;
      const { GLOBAL_ENV } = require("./env");
      expect(GLOBAL_ENV.MASK_SECRET).toBe(false);
    });

    it("should return true when NODE_ENV is production", () => {
      process.env.NODE_ENV = "production";
      delete process.env.MASK_SECRET;
      const { GLOBAL_ENV } = require("./env");
      expect(GLOBAL_ENV.MASK_SECRET).toBe(true);
    });

    it("should return true when NODE_ENV is staging", () => {
      process.env.NODE_ENV = "staging";
      delete process.env.MASK_SECRET;
      const { GLOBAL_ENV } = require("./env");
      expect(GLOBAL_ENV.MASK_SECRET).toBe(true);
    });
  });
});
