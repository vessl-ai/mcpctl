import fs from "fs";
import { Config } from "../../lib/types/config";
import { RegistryType } from "../../lib/types/registry";
import { FileConfigStoreImpl } from "./config-store";

jest.mock("fs");
jest.mock("path");
jest.mock("../../lib/env", () => ({
  getConfigDir: jest.fn().mockReturnValue("/test"),
  getConfigPath: jest.fn().mockReturnValue("/test/config.json"),
}));
const logger = {
  verbose: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  withContext: jest.fn().mockReturnThis(),
};

describe("FileConfigStore", () => {
  let configStore: FileConfigStoreImpl;
  const testConfigPath = "/test/config.json";

  const mockConfig: Config = {
    profile: {
      currentActiveProfile: "test-profile",
      allProfiles: ["test-profile"],
    },
    registry: {
      registries: [
        {
          name: "test-registry",
          url: "test-url",
          knownType: RegistryType.GLAMA,
        },
      ],
    },
    secrets: {
      shared: {},
    },
    sharedEnv: {
      SHARED_VAR: "shared_value",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));
    configStore = new FileConfigStoreImpl(logger, testConfigPath);
  });

  describe("constructor", () => {
    it("should create config file if it does not exist", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      configStore = new FileConfigStoreImpl(logger, testConfigPath);

      expect(fs.mkdirSync).toHaveBeenCalledWith("/test", { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        testConfigPath,
        JSON.stringify({})
      );
    });

    it("should not create config file if it exists", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      configStore = new FileConfigStoreImpl(logger, testConfigPath);

      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("getConfig", () => {
    it("should read and parse config file", () => {
      const config = configStore.getConfig();

      expect(fs.readFileSync).toHaveBeenCalledWith(testConfigPath, "utf8");
      expect(config).toEqual(mockConfig);
      expect(logger.verbose).toHaveBeenCalledWith(
        `Loading config from ${testConfigPath}`
      );
      expect(logger.verbose).toHaveBeenCalledWith(
        `Loaded config: ${JSON.stringify(mockConfig, null, 2)}`
      );
    });

    it("should handle empty config file", () => {
      (fs.readFileSync as jest.Mock).mockReturnValue("{}");

      const config = configStore.getConfig();

      expect(config).toEqual({});
    });

    it("should handle malformed config file", () => {
      (fs.readFileSync as jest.Mock).mockReturnValue("invalid json");

      expect(() => configStore.getConfig()).toThrow(SyntaxError);
    });
  });

  describe("saveConfig", () => {
    it("should write config to file", () => {
      configStore.saveConfig(mockConfig);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        testConfigPath,
        JSON.stringify(mockConfig, null, 2)
      );
      expect(logger.verbose).toHaveBeenCalledWith(
        `Saving config to ${testConfigPath}, ${JSON.stringify(
          mockConfig,
          null,
          2
        )}`
      );
      expect(logger.verbose).toHaveBeenCalledWith(
        `Saved config to ${testConfigPath}`
      );
    });

    it("should handle write errors", () => {
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error("Write error");
      });

      expect(() => configStore.saveConfig(mockConfig)).toThrow("Write error");
    });
  });
});
