import { Config } from "../../../core/lib/types/config";
import { Profile } from "../../../core/lib/types/profile";
import { ConfigService } from "../../../core/services/config/config-service";
import { ProfileService } from "../../../core/services/profile/profile-service";
import { Logger } from "../../../lib/logger/logger";
import { App } from "../../app";
import { envGetCommand, envListCommand, envSetCommand } from "./env";

// Mock dependencies
const mockLogger: jest.Mocked<Logger> = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  verbose: jest.fn(),
  withContext: jest.fn(),
};

const mockConfigService: jest.Mocked<ConfigService> = {
  getConfig: jest.fn(),
  getConfigSection: jest.fn(),
  updateConfig: jest.fn(),
  saveConfig: jest.fn(),
};

const mockProfileService: jest.Mocked<ProfileService> = {
  upsertProfileEnvForServer: jest.fn(),
  getProfileEnvForServer: jest.fn(),
  getProfile: jest.fn(),
  listProfiles: jest.fn(),
  upsertProfileSecretsForServer: jest.fn(),
  removeProfileSecret: jest.fn(),
  updateProfile: jest.fn(),
  setServerEnvForProfile: jest.fn(),
  createProfile: jest.fn(),
  deleteProfile: jest.fn(),
  setCurrentProfile: jest.fn(),
  getCurrentProfile: jest.fn(),
  getCurrentProfileName: jest.fn(),
  removeProfileEnvForServer: jest.fn(),
};

// Mock App class with Partial<App> to handle TypeScript type checking
const mockApp = {
  getLogger: () => mockLogger,
  getConfigService: () => mockConfigService,
  getProfileService: () => mockProfileService,
  container: {},
  initPromise: Promise.resolve(),
  init: jest.fn().mockResolvedValue(undefined),
  initializeDependencies: jest.fn().mockResolvedValue(undefined),
} as unknown as App;

let consoleSpy: jest.SpyInstance;

const mockConfig: Config = {
  sharedEnv: { EXISTING_KEY: "existing_value" },
  profile: {
    currentActiveProfile: "default",
    allProfiles: [],
  },
  registry: {
    registries: [],
  },
  secrets: {
    shared: {},
  },
};

const mockProfile: Profile = {
  name: "testProfile",
  servers: {
    testServer: {
      env: {},
    },
  },
};

describe("envSetCommand", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, "log").mockImplementation();
  });

  it("should set shared environment variables successfully", async () => {
    const argv = ["--shared", "-e", "KEY1=value1", "-e", "KEY2=value2"];
    mockConfigService.getConfig.mockReturnValue(mockConfig);

    await envSetCommand(mockApp, argv);

    expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
      sharedEnv: {
        EXISTING_KEY: "existing_value",
        KEY1: "value1",
        KEY2: "value2",
      },
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      "✅ Shared environment variables updated successfully!"
    );
  });

  it("should set profile environment variables successfully", async () => {
    const argv = ["-p", "testProfile", "-s", "testServer", "-e", "KEY=value"];

    mockProfileService.getProfile.mockReturnValue(mockProfile);

    await envSetCommand(mockApp, argv);

    expect(mockProfileService.upsertProfileEnvForServer).toHaveBeenCalledWith(
      "testProfile",
      "testServer",
      { KEY: "value" }
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "✅ Environment variables updated successfully for testProfile/testServer!"
    );
  });

  it("should fail when no environment variables are provided", async () => {
    const argv = ["-p", "testProfile", "-s", "testServer"];

    await expect(envSetCommand(mockApp, argv)).rejects.toThrow();
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Error: At least one environment variable is required (--env, -e)"
    );
  });

  it("should fail when using shared with profile", async () => {
    const argv = ["--shared", "-p", "testProfile", "-e", "KEY=value"];

    await expect(envSetCommand(mockApp, argv)).rejects.toThrow();
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Error: Cannot use --shared with --profile or --server"
    );
  });
});

describe("envGetCommand", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockExit = jest
      .spyOn(process, "exit")
      .mockImplementation((number) => {
        throw new Error("process.exit: " + number);
      });
  });

  it("should get shared environment variables successfully", async () => {
    const argv = ["--shared"];
    mockConfigService.getConfigSection.mockReturnValue({
      KEY1: "value1",
      KEY2: "value2",
    });

    await envGetCommand(mockApp, argv);

    expect(mockConfigService.getConfigSection).toHaveBeenCalledWith(
      "sharedEnv"
    );
    expect(consoleSpy).toHaveBeenCalledWith("  - KEY1: value1");
    expect(consoleSpy).toHaveBeenCalledWith("  - KEY2: value2");
  });

  it("should get profile environment variables successfully", async () => {
    const argv = ["-p", "testProfile", "-s", "testServer"];
    mockProfileService.getProfile.mockReturnValue({
      ...mockProfile,
      servers: { testServer: {} },
    });
    mockProfileService.getProfileEnvForServer.mockResolvedValue({
      env: { KEY: "value" },
    });

    await envGetCommand(mockApp, argv);

    expect(mockProfileService.getProfile).toHaveBeenCalledWith("testProfile");
    expect(mockProfileService.getProfileEnvForServer).toHaveBeenCalledWith(
      "testProfile",
      "testServer"
    );
    expect(consoleSpy).toHaveBeenCalledWith("  - KEY: value");
  });

  it("should fail when profile not found", async () => {
    const argv = ["-p", "nonexistentProfile", "-s", "testServer"];
    mockProfileService.getProfile.mockReturnValue(undefined);

    await expect(envGetCommand(mockApp, argv)).rejects.toThrow();
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Profile 'nonexistentProfile' not found"
    );
  });

  it("should fail when server not found in profile", async () => {
    const argv = ["-p", "testProfile", "-s", "nonexistentServer"];
    mockProfileService.getProfile.mockReturnValue({
      ...mockProfile,
      servers: {},
    });

    await expect(envGetCommand(mockApp, argv)).rejects.toThrow();
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Server 'nonexistentServer' not found in profile 'testProfile'"
    );
  });
});

describe("envListCommand", () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    // Reset process.exit implementation
    const mockExit = jest
      .spyOn(process, "exit")
      .mockImplementation((number) => {
        throw new Error("process.exit: " + number);
      });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("should list all environment variables when no options provided", async () => {
    const argv: string[] = [];
    mockConfigService.getConfigSection.mockReturnValue({
      SHARED_KEY1: "shared_value1",
      SHARED_KEY2: "shared_value2",
    });
    mockProfileService.listProfiles.mockReturnValue([
      {
        name: "profile1",
        servers: {
          server1: {
            env: {
              env: {
                PROF1_KEY1: "prof1_value1",
                PROF1_KEY2: "prof1_value2",
              },
            },
          },
        },
      },
      {
        name: "profile2",
        servers: {
          server2: {
            env: {
              env: {
                PROF2_KEY: "prof2_value",
              },
            },
          },
        },
      },
    ]);

    await envListCommand(mockApp, argv);

    // Check shared env section
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "\n🔍 All environment variables:"
    );
    expect(consoleLogSpy).toHaveBeenCalledWith("==========================");
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "\n📌 Shared environment variables:"
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "------------------------------"
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "  - SHARED_KEY1: shared_value1"
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "  - SHARED_KEY2: shared_value2"
    );

    // Check profile1/server1 section
    expect(consoleLogSpy).toHaveBeenCalledWith("\n📌 profile1/server1:");
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "-".repeat("profile1".length + "server1".length + 4)
    );
    expect(consoleLogSpy).toHaveBeenCalledWith("  - PROF1_KEY1: prof1_value1");
    expect(consoleLogSpy).toHaveBeenCalledWith("  - PROF1_KEY2: prof1_value2");

    // Check profile2/server2 section
    expect(consoleLogSpy).toHaveBeenCalledWith("\n📌 profile2/server2:");
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "-".repeat("profile2".length + "server2".length + 4)
    );
    expect(consoleLogSpy).toHaveBeenCalledWith("  - PROF2_KEY: prof2_value");
  });

  it("should show only headers when no environment variables exist", async () => {
    const argv: string[] = [];
    mockConfigService.getConfigSection.mockReturnValue({});
    mockProfileService.listProfiles.mockReturnValue([
      {
        name: "profile1",
        servers: {
          server1: {},
        },
      },
    ]);

    await envListCommand(mockApp, argv);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      "\n🔍 All environment variables:"
    );
    expect(consoleLogSpy).toHaveBeenCalledWith("==========================");
  });

  it("should list shared environment variables successfully", async () => {
    const argv: string[] = ["--shared"];
    mockConfigService.getConfigSection.mockReturnValue({
      KEY1: "value1",
      KEY2: "value2",
    });

    await envListCommand(mockApp, argv);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      "\n🔍 Shared environment variables:"
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "=============================="
    );
    expect(consoleLogSpy).toHaveBeenCalledWith("  - KEY1: value1");
    expect(consoleLogSpy).toHaveBeenCalledWith("  - KEY2: value2");
  });

  it("should show message when no shared environment variables exist", async () => {
    const argv: string[] = ["--shared"];
    mockConfigService.getConfigSection.mockReturnValue({});

    await envListCommand(mockApp, argv);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      "\n🔍 Shared environment variables:"
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "=============================="
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "  No shared environment variables set"
    );
  });

  it("should list profile environment variables successfully", async () => {
    const argv: string[] = ["-p", "testProfile", "-s", "testServer"];
    mockProfileService.getProfile.mockReturnValue({
      ...mockProfile,
      servers: {
        testServer: {
          env: {
            env: {
              KEY1: "value1",
              KEY2: "value2",
            },
          },
        },
      },
    });

    await envListCommand(mockApp, argv);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      "\n🔍 Environment variables for testProfile/testServer:"
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "=========================================="
    );
    expect(consoleLogSpy).toHaveBeenCalledWith("  - KEY1: value1");
    expect(consoleLogSpy).toHaveBeenCalledWith("  - KEY2: value2");
  });

  it("should show message when no profile environment variables exist", async () => {
    const argv: string[] = ["-p", "testProfile", "-s", "testServer"];
    mockProfileService.getProfile.mockReturnValue({
      ...mockProfile,
      servers: {
        testServer: {},
      },
    });

    await envListCommand(mockApp, argv);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      "\n🔍 Environment variables for testProfile/testServer:"
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "=========================================="
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "  No environment variables set"
    );
  });

  it("should fail when profile not found", async () => {
    const argv: string[] = ["-p", "nonexistentProfile", "-s", "testServer"];
    mockProfileService.getProfile.mockReturnValue(undefined);

    await expect(envListCommand(mockApp, argv)).rejects.toThrow();
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Profile 'nonexistentProfile' not found"
    );
  });

  it("should fail when server not found in profile", async () => {
    const argv: string[] = ["-p", "testProfile", "-s", "nonexistentServer"];
    mockProfileService.getProfile.mockReturnValue({
      ...mockProfile,
      servers: {},
    });

    await expect(envListCommand(mockApp, argv)).rejects.toThrow();
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Server 'nonexistentServer' not found in profile 'testProfile'"
    );
  });

  it("should fail when using shared with profile", async () => {
    const argv: string[] = ["--shared", "-p", "testProfile"];

    await expect(envListCommand(mockApp, argv)).rejects.toThrow();
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Error: Cannot use --shared with --profile or --server"
    );
  });

  it("should fail when using shared with server", async () => {
    const argv: string[] = ["--shared", "-s", "testServer"];

    await expect(envListCommand(mockApp, argv)).rejects.toThrow();
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Error: Cannot use --shared with --profile or --server"
    );
  });

  it("should fail when using server without profile", async () => {
    const argv: string[] = ["-s", "testServer"];

    await expect(envListCommand(mockApp, argv)).rejects.toThrow();
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Error: Profile name is required (--profile, -p) when using --server"
    );
  });

  it("should fail when using profile without server", async () => {
    const argv = ["-p", "testProfile"];
    mockProfileService.getProfile.mockReturnValue({
      ...mockProfile,
      servers: {
        server1: {
          env: {
            env: {
              KEY1: "value1",
            },
          },
        },
        server2: {
          env: {
            env: {
              KEY2: "value2",
            },
          },
        },
      },
    });

    await envListCommand(mockApp, argv);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      "\n🔍 Environment variables for profile 'testProfile':"
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "=================================================="
    );

    expect(consoleLogSpy).toHaveBeenCalledWith("\n📌 Server: server1");
    expect(consoleLogSpy).toHaveBeenCalledWith("--------------------");
    expect(consoleLogSpy).toHaveBeenCalledWith("  - KEY1: value1");

    expect(consoleLogSpy).toHaveBeenCalledWith("\n📌 Server: server2");
    expect(consoleLogSpy).toHaveBeenCalledWith("--------------------");
    expect(consoleLogSpy).toHaveBeenCalledWith("  - KEY2: value2");
  });

  it("should show message when profile has no servers", async () => {
    const argv = ["-p", "testProfile"];
    mockProfileService.getProfile.mockReturnValue({
      ...mockProfile,
      servers: {},
    });

    await envListCommand(mockApp, argv);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      "\n🔍 Environment variables for profile 'testProfile':"
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "=================================================="
    );
    expect(consoleLogSpy).toHaveBeenCalledWith("  No servers found in profile");
  });

  it("should show there's no environment variables in servers when servers have no environment variables", async () => {
    const argv = ["-p", "testProfile"];
    mockProfileService.getProfile.mockReturnValue({
      ...mockProfile,
      servers: {
        server1: {},
        server2: { env: {} },
      },
    });

    await envListCommand(mockApp, argv);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      "\n🔍 Environment variables for profile 'testProfile':"
    );
    expect(consoleLogSpy).toHaveBeenLastCalledWith(
      "=================================================="
    );
  });

  it("should show only servers that has env variables set", async () => {
    const argv = ["-p", "testProfile"];
    mockProfileService.getProfile.mockReturnValue({
      ...mockProfile,
      servers: {
        server1: {},
        server2: {},
        server3: {
          env: {
            env: {
              KEY1: "value1",
            },
          },
        },
      },
    });

    await envListCommand(mockApp, argv);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      "\n🔍 Environment variables for profile 'testProfile':"
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "=================================================="
    );
    expect(consoleLogSpy).toHaveBeenCalledWith("\n📌 Server: server3");
    expect(consoleLogSpy).toHaveBeenCalledWith("--------------------");
    expect(consoleLogSpy).toHaveBeenCalledWith("  - KEY1: value1");
  });
});
