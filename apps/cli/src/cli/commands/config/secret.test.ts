import {
  ResourceNotFoundError,
  ValidationError,
} from "../../../../../../packages/lib/src/errors";
import { Profile } from "../../../../../packages/core/lib/types/profile";
import { SecretReference } from "../../../../../packages/core/lib/types/secret";
import { ProfileService } from "../../../../../packages/core/services/profile/profile-service";
import { SecretService } from "../../../../../packages/core/services/secret/secret-service";
import { Logger } from "../../../../../packages/lib/logger/logger";
import { App } from "../../app";
import {
  secretGetCommand,
  secretListCommand,
  secretRemoveCommand,
  secretSetCommand,
} from "./secret";

// Mock implementations
jest.mock("../../app");
jest.mock("../../../core/services/secret/secret-service");
jest.mock("../../../core/services/profile/profile-service");
jest.mock("../../../lib/logger/logger");

describe("Secret Commands", () => {
  let app: jest.Mocked<App>;
  let secretService: jest.Mocked<SecretService>;
  let profileService: jest.Mocked<ProfileService>;
  let logger: jest.Mocked<Logger>;
  let mockExit: jest.SpyInstance;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup console spy
    consoleSpy = jest.spyOn(console, "log").mockImplementation();

    // Setup mocks
    logger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      verbose: jest.fn(),
      withContext: jest.fn(),
    } as jest.Mocked<Logger>;

    secretService = {
      setSharedSecrets: jest.fn(),
      getSharedSecret: jest.fn(),
      listSharedSecrets: jest.fn(),
      removeSharedSecret: jest.fn(),
      getProfileSecret: jest.fn(),
      setProfileSecret: jest.fn(),
      removeProfileSecret: jest.fn(),
      setSharedSecret: jest.fn(),
      resolveEnv: jest.fn(),
    } as jest.Mocked<SecretService>;

    profileService = {
      upsertProfileEnvForServer: jest.fn(),
      removeProfileEnvForServer: jest.fn(),
      getProfile: jest.fn(),
      removeProfileSecret: jest.fn(),
      getCurrentProfile: jest.fn(),
      getCurrentProfileName: jest.fn(),
      setCurrentProfile: jest.fn(),
      getProfileEnvForServer: jest.fn(),
      updateProfile: jest.fn(),
      setServerEnvForProfile: jest.fn(),
      upsertProfileSecretsForServer: jest.fn(),
      createProfile: jest.fn(),
      deleteProfile: jest.fn(),
      listProfiles: jest.fn(),
    } as jest.Mocked<ProfileService>;

    app = {
      getLogger: jest.fn().mockReturnValue(logger),
      getSecretService: jest.fn().mockReturnValue(secretService),
      getProfileService: jest.fn().mockReturnValue(profileService),
      init: jest.fn(),
      getConfigService: jest.fn(),
      getRegistryService: jest.fn(),
      getSearchService: jest.fn(),
      getServerService: jest.fn(),
      getMcpClientService: jest.fn(),
      getSessionManager: jest.fn(),
      getClientService: jest.fn(),
    } as unknown as jest.Mocked<App>;
  });

  describe("secretSetCommand", () => {
    it("should set shared secrets when --shared flag is used", async () => {
      const argv = [
        "--shared",
        "--entry",
        "KEY1=value1",
        "--entry",
        "KEY2=value2",
      ];
      await secretSetCommand(app, argv);

      expect(secretService.setSharedSecrets).toHaveBeenCalledWith({
        KEY1: "value1",
        KEY2: "value2",
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        "✅ Shared secret updated successfully!"
      );
    });

    it("should set profile secrets when profile and server are specified", async () => {
      profileService.getProfile.mockReturnValue({
        name: "myProfile",
        servers: {
          myServer: {
            env: {},
          },
        },
      });

      const argv = [
        "--profile",
        "myProfile",
        "--server",
        "myServer",
        "--entry",
        "KEY1=value1",
      ];
      await secretSetCommand(app, argv);

      expect(profileService.upsertProfileSecretsForServer).toHaveBeenCalledWith(
        "myProfile",
        "myServer",
        { KEY1: "value1" }
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "✅ Secret updated successfully for myProfile/myServer!"
      );
    });

    it("should fail when using both --shared and --profile flags", async () => {
      const argv = [
        "--shared",
        "--profile",
        "myProfile",
        "--entry",
        "KEY=value",
      ];
      await expect(secretSetCommand(app, argv)).rejects.toThrow(
        new ValidationError("Cannot use --shared with --profile or --server")
      );

      expect(logger.error).toHaveBeenCalledWith(
        "Error: Cannot use --shared with --profile or --server"
      );
    });
  });

  describe("secretGetCommand", () => {
    it("should get all shared secrets when --shared flag is used", async () => {
      secretService.listSharedSecrets.mockReturnValue({
        KEY1: { key: "KEY1", value: "value1" } as SecretReference,
        KEY2: {
          key: "KEY2",
          value: "value2",
          description: "test desc",
        } as SecretReference,
      });
      secretService.getSharedSecret.mockImplementation(async (key) =>
        key === "KEY1" ? "value1" : "value2"
      );

      const argv = ["--shared"];
      await secretGetCommand(app, argv);

      expect(secretService.listSharedSecrets).toHaveBeenCalled();
      expect(secretService.getSharedSecret).toHaveBeenCalledTimes(2);
    });

    it("should get specific profile secret when profile, server and key are specified", async () => {
      const mockProfile: Profile = {
        name: "myProfile",
        servers: {
          myServer: {
            env: {
              env: {},
              secrets: {
                KEY1: { key: "KEY1" } as SecretReference,
              },
            },
          },
        },
      };
      profileService.getProfile.mockReturnValue(mockProfile);

      const argv = [
        "--profile",
        "myProfile",
        "--server",
        "myServer",
        "--key",
        "KEY1",
      ];
      await secretGetCommand(app, argv);

      expect(profileService.getProfile).toHaveBeenCalledWith("myProfile");
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("KEY1"));
    });
  });

  describe("secretRemoveCommand", () => {
    it("should remove shared secret when --shared flag is used", async () => {
      const argv = ["--shared", "--key", "KEY1"];
      await secretRemoveCommand(app, argv);

      expect(secretService.removeSharedSecret).toHaveBeenCalledWith("KEY1");
      expect(consoleSpy).toHaveBeenCalledWith(
        "✅ Shared secret 'KEY1' removed successfully!"
      );
    });

    it("should remove profile secret when profile and server are specified", async () => {
      const argv = [
        "--profile",
        "myProfile",
        "--server",
        "myServer",
        "--key",
        "KEY1",
      ];
      await secretRemoveCommand(app, argv);

      expect(profileService.removeProfileSecret).toHaveBeenCalledWith(
        "myProfile",
        "myServer",
        "KEY1"
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "✅ Secret 'KEY1' removed successfully from myProfile/myServer!"
      );
    });

    it("should fail when key is not provided", async () => {
      const argv = ["--shared"];
      await expect(secretRemoveCommand(app, argv)).rejects.toThrow(
        new ValidationError("Secret key is required")
      );

      expect(logger.error).toHaveBeenCalledWith(
        "Error: Secret key is required (--key, -k)"
      );
    });
  });

  describe("secretListCommand", () => {
    it("should list shared secrets when --shared flag is used", async () => {
      const mockSharedSecrets = {
        KEY1: {
          key: "KEY1",
          description: "First shared secret",
        } as SecretReference,
        KEY2: {
          key: "KEY2",
          description: "Second shared secret",
        } as SecretReference,
      };
      secretService.listSharedSecrets.mockReturnValue(mockSharedSecrets);

      const argv = ["--shared"];
      await secretListCommand(app, argv);

      expect(secretService.listSharedSecrets).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("\n🔐 Shared secrets:");
      expect(consoleSpy).toHaveBeenCalledWith("================");
      expect(consoleSpy).toHaveBeenCalledWith("  - KEY1: First shared secret");
      expect(consoleSpy).toHaveBeenCalledWith("  - KEY2: Second shared secret");
    });

    it("should show message when no shared secrets exist", async () => {
      secretService.listSharedSecrets.mockReturnValue({});

      const argv = ["--shared"];
      await secretListCommand(app, argv);

      expect(secretService.listSharedSecrets).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("\n🔐 Shared secrets:");
      expect(consoleSpy).toHaveBeenCalledWith("================");
      expect(consoleSpy).toHaveBeenCalledWith("  No shared secrets set");
    });

    it("should list profile secrets when profile and server are specified", async () => {
      const mockProfile: Profile = {
        name: "testProfile",
        servers: {
          testServer: {
            env: {
              env: {},
              secrets: {
                KEY1: {
                  key: "secret1",
                  description: "First secret",
                } as SecretReference,
                KEY2: {
                  key: "secret2",
                  description: "Second secret",
                } as SecretReference,
              },
            },
          },
        },
      };
      profileService.getProfile.mockReturnValue(mockProfile);

      const argv = ["--profile", "testProfile", "--server", "testServer"];
      await secretListCommand(app, argv);

      expect(profileService.getProfile).toHaveBeenCalledWith("testProfile");
      expect(consoleSpy).toHaveBeenCalledWith(
        "\n🔐 Secrets for testProfile/testServer:"
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "====================================="
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "  - KEY1: secret1 (First secret)"
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "  - KEY2: secret2 (Second secret)"
      );
    });

    it("should show message when no profile secrets exist", async () => {
      const mockProfile: Profile = {
        name: "testProfile",
        servers: {
          testServer: {
            env: {
              env: {},
              secrets: {},
            },
          },
        },
      };
      profileService.getProfile.mockReturnValue(mockProfile);

      const argv = ["--profile", "testProfile", "--server", "testServer"];
      await secretListCommand(app, argv);

      expect(profileService.getProfile).toHaveBeenCalledWith("testProfile");
      expect(consoleSpy).toHaveBeenCalledWith(
        "\n🔐 Secrets for testProfile/testServer:"
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "====================================="
      );
      expect(consoleSpy).toHaveBeenCalledWith("  No secrets set");
    });

    it("should list all secrets when no flags are provided", async () => {
      // Mock shared secrets
      const mockSharedSecrets = {
        SHARED1: {
          key: "SHARED1",
          description: "First shared secret",
        } as SecretReference,
      };
      secretService.listSharedSecrets.mockReturnValue(mockSharedSecrets);

      // Mock profiles and their secrets
      const mockProfiles = [
        {
          name: "profile1",
          servers: {
            server1: {
              env: {
                env: {},
                secrets: {
                  KEY1: {
                    key: "secret1",
                    description: "Profile 1 secret",
                  } as SecretReference,
                },
              },
            },
          },
        },
      ];
      profileService.listProfiles.mockReturnValue(mockProfiles);

      const argv: string[] = [];
      await secretListCommand(app, argv);

      // Verify shared secrets section
      expect(consoleSpy).toHaveBeenCalledWith("\n📋 All Secrets");
      expect(consoleSpy).toHaveBeenCalledWith("=============");
      expect(consoleSpy).toHaveBeenCalledWith("\n🔐 Shared secrets:");
      expect(consoleSpy).toHaveBeenCalledWith("----------------");
      expect(consoleSpy).toHaveBeenCalledWith(
        "  - SHARED1: First shared secret"
      );

      // Verify profile secrets section
      expect(consoleSpy).toHaveBeenCalledWith("\n🔐 profile1/server1:");
      expect(consoleSpy).toHaveBeenCalledWith("=============");
      expect(consoleSpy).toHaveBeenCalledWith(
        "  - KEY1: secret1 (Profile 1 secret)"
      );
    });

    it("should fail when profile not found", async () => {
      profileService.getProfile.mockReturnValue(undefined);
      const argv = [
        "--profile",
        "nonexistentProfile",
        "--server",
        "testServer",
      ];

      await expect(secretListCommand(app, argv)).rejects.toThrow(
        new ResourceNotFoundError("Profile 'nonexistentProfile' not found")
      );
      expect(logger.error).toHaveBeenCalledWith(
        "Profile 'nonexistentProfile' not found"
      );
    });

    it("should fail when server not found in profile", async () => {
      const mockProfile: Profile = {
        name: "testProfile",
        servers: {},
      };
      profileService.getProfile.mockReturnValue(mockProfile);
      const argv = [
        "--profile",
        "testProfile",
        "--server",
        "nonexistentServer",
      ];

      await expect(secretListCommand(app, argv)).rejects.toThrow(
        new ResourceNotFoundError(
          "Server 'nonexistentServer' not found in profile 'testProfile'"
        )
      );
      expect(logger.error).toHaveBeenCalledWith(
        "Server 'nonexistentServer' not found in profile 'testProfile'"
      );
    });
  });
});
