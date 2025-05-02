import { Logger } from "../../../lib/logger/logger";
import { McpServerType } from "../../lib/types/mcp-server";
import { Profile } from "../../lib/types/profile";
import { ConfigService } from "../config/config-service";
import { SecretService } from "../secret/secret-service";
import { defaultProfile } from "./default-profile";
import { ProfileServiceImpl } from "./profile-service";
import { ProfileStore } from "./profile-store";

describe("ProfileService", () => {
  let profileStore: jest.Mocked<ProfileStore>;
  let configService: jest.Mocked<ConfigService>;
  let profileService: ProfileServiceImpl;
  let secretService: jest.Mocked<SecretService>;
  let logger: Logger;

  const mockProfile: () => Profile = () => ({
    name: "test-profile",
    servers: {
      "test-server": {
        type: McpServerType.STDIO,
        command: "test-command",
        args: ["--test"],
        env: {
          env: { TEST: "value" },
          secrets: {},
        },
      },
    },
  });

  const mockConfig = () => ({
    profile: {
      currentActiveProfile: "test-profile",
      allProfiles: ["default", "test-profile"],
    },
    registry: {
      registries: [],
    },
    secrets: {
      shared: {},
    },
  });

  beforeEach(() => {
    profileStore = {
      exists: jest.fn(),
      loadProfile: jest.fn(),
      saveProfile: jest.fn(),
      listProfileNames: jest.fn(),
      listProfiles: jest.fn(),
      deleteProfile: jest.fn(),
    } as jest.Mocked<ProfileStore>;

    configService = {
      getConfig: jest.fn(),
      getConfigSection: jest.fn(),
      saveConfig: jest.fn(),
      updateConfig: jest.fn(),
    } as jest.Mocked<ConfigService>;

    secretService = {
      getSecret: jest.fn(),
      setSecret: jest.fn(),
      setSecrets: jest.fn(),
      removeSecret: jest.fn(),
      listSecrets: jest.fn(),
      resolveEnv: jest.fn(),
    } as jest.Mocked<SecretService>;

    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      withContext: jest.fn(),
      verbose: jest.fn(),
    };

    configService.getConfig.mockReturnValue(mockConfig());
    profileStore.exists.mockReturnValue(true);
    profileStore.loadProfile.mockReturnValue(mockProfile());
    profileStore.listProfileNames.mockReturnValue(["default", "test-profile"]);
    profileStore.listProfiles.mockReturnValue([defaultProfile, mockProfile()]);

    profileService = new ProfileServiceImpl(
      profileStore,
      configService,
      secretService
    );
  });

  describe("constructor", () => {
    it("should load current profile from store if it exists", () => {
      expect(configService.getConfig).toHaveBeenCalled();
      expect(profileStore.exists).toHaveBeenCalledWith("test-profile");
      expect(profileStore.loadProfile).toHaveBeenCalledWith("test-profile");
    });

    it("should use default profile if current profile does not exist", () => {
      profileStore.exists.mockReturnValue(false);

      profileService = new ProfileServiceImpl(
        profileStore,
        configService,
        secretService
      );

      expect(profileService.getCurrentProfile()).toEqual(defaultProfile);
    });
  });

  describe("setCurrentProfile", () => {
    it("should set current profile and update config", () => {
      profileService.setCurrentProfile("test-profile");

      expect(profileStore.loadProfile).toHaveBeenCalledWith("test-profile");
      expect(configService.updateConfig).toHaveBeenCalledWith({
        profile: {
          currentActiveProfile: "test-profile",
          allProfiles: ["default", "test-profile"],
        },
      });
    });

    it("should throw error if profile does not exist", () => {
      profileStore.exists.mockReturnValue(false);

      expect(() => profileService.setCurrentProfile("non-existent")).toThrow(
        "Profile non-existent does not exist"
      );
    });
  });

  describe("getCurrentProfile", () => {
    it("should return current profile", () => {
      const profile = profileService.getCurrentProfile();
      expect(profile).toEqual(mockProfile());
    });

    it("should load profile from store if not cached", () => {
      profileService = new ProfileServiceImpl(
        profileStore,
        configService,
        secretService
      );
      const profile = profileService.getCurrentProfile();

      expect(profileStore.loadProfile).toHaveBeenCalledWith("test-profile");
      expect(profile).toEqual(mockProfile());
    });
  });

  describe("updateProfile", () => {
    it("should update profile and config", () => {
      const updatedProfile = { ...mockProfile(), name: "updated" };
      profileService.updateProfile("test-profile", updatedProfile);

      expect(profileStore.saveProfile).toHaveBeenCalledWith(
        "test-profile",
        updatedProfile
      );
      expect(configService.updateConfig).toHaveBeenCalledWith({
        profile: {
          currentActiveProfile: "test-profile",
          allProfiles: ["default", "test-profile"],
        },
      });
    });
  });

  describe("setServerEnvForProfile", () => {
    it("should update server env and save profile", () => {
      const newEnv = { NEW: "value" };
      profileService.setServerEnvForProfile(
        "test-profile",
        "test-server",
        newEnv
      );

      const expectedProfile = {
        ...mockProfile(),
        servers: {
          "test-server": {
            ...mockProfile().servers["test-server"],
            env: {
              env: newEnv,
              secrets: {},
            },
          },
        },
      };

      expect(profileStore.saveProfile).toHaveBeenCalledWith(
        "test-profile",
        expectedProfile
      );
    });
  });

  describe("getProfileEnvForServer", () => {
    it("should return env and just secret references", async () => {
      const env = { TEST: "value" };

      profileStore.loadProfile.mockReturnValue({
        ...mockProfile(),
        servers: {
          "test-server": {
            ...mockProfile().servers["test-server"],
            env: {
              env,
              secrets: {
                SECRET: {
                  key: "SECRET",
                  description: "Test secret",
                },
              },
            },
          },
        },
      });

      const resolved = await profileService.getProfileEnvForServer(
        "test-profile",
        "test-server"
      );

      expect(resolved).toEqual({
        env: { TEST: "value" },
        secrets: {
          SECRET: { key: "SECRET", description: expect.anything() },
        },
      });
    });
  });

  describe("getProfile", () => {
    it("should load profile from store", () => {
      const profile = profileService.getProfile("test-profile");

      expect(profileStore.loadProfile).toHaveBeenCalledWith("test-profile");
      expect(profile).toEqual(mockProfile());
    });
  });

  describe("createProfile", () => {
    it("should create new profile and update config", () => {
      profileService.createProfile("new-profile");

      const expectedProfile = {
        ...defaultProfile,
        name: "new-profile",
      };

      expect(profileStore.saveProfile).toHaveBeenCalledWith(
        "new-profile",
        expectedProfile
      );
      expect(configService.updateConfig).toHaveBeenCalledWith({
        profile: {
          currentActiveProfile: "test-profile",
          allProfiles: ["default", "test-profile"],
        },
      });
    });
  });

  describe("listProfiles", () => {
    it("should return list of profiles from store", () => {
      const profiles = profileService.listProfiles();

      expect(profileStore.listProfiles).toHaveBeenCalled();
      expect(profiles).toEqual([defaultProfile, mockProfile()]);
    });
  });

  describe("deleteProfile", () => {
    it("should delete profile and update config", () => {
      profileStore.listProfileNames.mockReturnValue(["default"]);

      profileService.deleteProfile("test-profile");

      expect(profileStore.deleteProfile).toHaveBeenCalledWith("test-profile");
      expect(profileStore.loadProfile).toHaveBeenCalledWith("default");
      expect(configService.updateConfig).toHaveBeenCalledWith({
        profile: {
          currentActiveProfile: "default",
          allProfiles: ["default"],
        },
      });
    });

    it("should switch to first available profile if current profile is deleted", () => {
      profileStore.listProfileNames.mockReturnValue(["other-profile"]);

      profileService.deleteProfile("test-profile");

      expect(profileStore.loadProfile).toHaveBeenCalledWith("other-profile");
      expect(configService.updateConfig).toHaveBeenCalledWith({
        profile: {
          currentActiveProfile: "other-profile",
          allProfiles: ["other-profile"],
        },
      });
    });
  });
});
