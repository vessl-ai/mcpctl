import fs from 'fs';
import path from 'path';
import { McpServerType } from '../../lib/types/mcp-server';
import { Profile } from '../../lib/types/profile';
import { defaultProfile } from './default-profile';
import { ProfileStoreImpl } from './profile-store';

jest.mock('fs');
jest.mock('path');
jest.mock('../../lib/env', () => ({
  getProfileDir: jest.fn().mockReturnValue('/test/profiles')
}));

describe('ProfileStore', () => {
  let profileStore: ProfileStoreImpl;
  const testProfileDir = '/test/profiles';

  const mockProfile: Profile = {
    ...defaultProfile,
    name: 'test-profile',
    servers: {
      'test-server': {
        type: McpServerType.STDIO,
        command: 'test-command',
        args: ['--test'],
        env: { TEST: 'value' }
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockProfile));
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    profileStore = new ProfileStoreImpl(testProfileDir);
  });

  describe('constructor', () => {
    it('should create profile directory if it does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      profileStore = new ProfileStoreImpl(testProfileDir);

      expect(fs.mkdirSync).toHaveBeenCalledWith(testProfileDir, { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/profiles/default.json',
        JSON.stringify(defaultProfile, null, 2)
      );
    });

    it('should not create directory if it exists', () => {
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(true)  // profileDir exists
        .mockReturnValueOnce(true); // default.json exists
      
      profileStore = new ProfileStoreImpl(testProfileDir);

      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('exists', () => {
    it('should return true if profile exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      const exists = profileStore.exists('test-profile');
      
      expect(exists).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith('/test/profiles/test-profile.json');
    });

    it('should return false if profile does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      const exists = profileStore.exists('non-existent');
      
      expect(exists).toBe(false);
    });
  });

  describe('loadProfile', () => {
    it('should load and parse profile file', () => {
      const profile = profileStore.loadProfile('test-profile');

      expect(fs.readFileSync).toHaveBeenCalledWith('/test/profiles/test-profile.json', 'utf8');
      expect(profile).toEqual(mockProfile);
    });

    it('should throw error if profile file is malformed', () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      expect(() => profileStore.loadProfile('test-profile')).toThrow(SyntaxError);
    });
  });

  describe('saveProfile', () => {
    it('should write profile to file', () => {
      profileStore.saveProfile('test-profile', mockProfile);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/profiles/test-profile.json',
        JSON.stringify(mockProfile, null, 2)
      );
    });

    it('should handle write errors', () => {
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Write error');
      });

      expect(() => profileStore.saveProfile('test-profile', mockProfile)).toThrow('Write error');
    });
  });

  describe('listProfileNames', () => {
    it('should return list of profile names', () => {
      (fs.readdirSync as jest.Mock).mockReturnValue(['default.json', 'test-profile.json']);

      const names = profileStore.listProfileNames();

      expect(names).toEqual(['default', 'test-profile']);
    });
  });

  describe('listProfiles', () => {
    it('should return list of all profiles', () => {
      (fs.readdirSync as jest.Mock).mockReturnValue(['default.json', 'test-profile.json']);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockProfile));

      const profiles = profileStore.listProfiles();

      expect(profiles).toEqual([mockProfile, mockProfile]);
    });
  });

  describe('deleteProfile', () => {
    it('should delete profile file', () => {
      profileStore.deleteProfile('test-profile');

      expect(fs.unlinkSync).toHaveBeenCalledWith('/test/profiles/test-profile.json');
    });

    it('should handle delete errors', () => {
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {
        throw new Error('Delete error');
      });

      expect(() => profileStore.deleteProfile('test-profile')).toThrow('Delete error');
    });
  });
}); 