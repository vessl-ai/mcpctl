import fs from 'fs';
import os from 'os';
import path from 'path';
import { McpClient, McpClientType } from '../../lib/types/mcp-client';
import { McpServerInstallConfig, McpServerType } from '../../lib/types/mcp-server';
import { ProfileService } from '../profile/profile-service';
import { SecretService } from '../secret/secret-service';
import { McpClientServiceImpl, newMcpClientService } from './mcp-client-service';
jest.mock('fs');
jest.mock('os');
jest.mock('path');

const logger = {
  verbose: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  withContext: jest.fn().mockReturnThis(),
};

const mockSecretService: SecretService = {
  getSharedSecret: jest.fn(),
  getProfileSecret: jest.fn(),
  setSharedSecret: jest.fn(),
  setProfileSecret: jest.fn(),
  removeSharedSecret: jest.fn(),
  removeProfileSecret: jest.fn(),
  setSharedSecrets: jest.fn(),
  listSharedSecrets: jest.fn(),
  resolveEnv: jest.fn(),
};

const mockProfileService: ProfileService = {
  getProfile: jest.fn(),
  getProfileEnvForServer: jest.fn(),
  upsertProfileEnvForServer: jest.fn(),
  setCurrentProfile: jest.fn(),
  getCurrentProfile: jest.fn(),
  getCurrentProfileName: jest.fn(),
  removeProfileEnvForServer: jest.fn(),
  listProfiles: jest.fn(),
  upsertProfileSecretsForServer: jest.fn(),
  removeProfileSecret: jest.fn(),
  updateProfile: jest.fn(),
  setServerEnvForProfile: jest.fn(),
  createProfile: jest.fn(),
  deleteProfile: jest.fn(),
};

describe('McpClientService', () => {
  let service: McpClientServiceImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new McpClientServiceImpl(mockProfileService, mockSecretService, logger);
  });

  describe('getClient', () => {
    it('should return claude client', () => {
      const client = service.getClient('claude');
      expect(client).toEqual({
        type: McpClientType.CLAUDE,
        name: 'claude',
      });
    });

    it('should return cursor client', () => {
      const client = service.getClient('cursor');
      expect(client).toEqual({
        type: McpClientType.CURSOR,
        name: 'cursor',
      });
    });

    it('should throw error for unsupported client', () => {
      expect(() => service.getClient('unknown')).toThrow('Unsupported client: unknown');
    });
  });

  describe('generateMcpServerConfig', () => {
    const baseConfig: McpServerInstallConfig = {
      type: 'stdio',
      command: 'test-command',
      profile: 'test-profile',
      env: { TEST: 'value' },
      serverName: 'custom-server',
    };

    it('should generate config with provided server name', () => {
      const config = service.generateMcpServerConfig({
        ...baseConfig,
        serverName: 'other-custom-server',
      });

      expect(config).toEqual({
        'other-custom-server': {
          type: McpServerType.STDIO,
          command: 'mcpctl',
          args: [
            'session',
            'connect',
            '--server',
            'other-custom-server',
            '--command',
            'test-command',
            '--env',
            'TEST=value',
            '--profile',
            'test-profile',
          ],
          profile: 'test-profile',
        },
      });
    });

    it('should generate config with auto-generated server name', () => {
      const config = service.generateMcpServerConfig(baseConfig);

      expect(config).toEqual({
        'custom-server': {
          type: McpServerType.STDIO,
          command: 'mcpctl',
          args: [
            'session',
            'connect',
            '--server',
            'custom-server',
            '--command',
            'test-command',
            '--env',
            'TEST=value',
            '--profile',
            'test-profile',
          ],
          profile: 'test-profile',
        },
      });
    });

    it('should throw error for unsupported type', () => {
      expect(() =>
        service.generateMcpServerConfig({
          ...baseConfig,
          type: 'sse' as any,
        })
      ).toThrow('SSE is not supported yet');
    });
  });

  describe('installMcpServerToClient', () => {
    const mockConfig = {
      mcpServers: {},
    };

    const baseInstallConfig: McpServerInstallConfig = {
      type: 'stdio',
      command: 'test-command',
      profile: 'test-profile',
      serverName: 'custom-server',
    };

    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));
      (os.platform as jest.Mock).mockReturnValue('darwin');
      (os.homedir as jest.Mock).mockReturnValue('/Users/test');
      (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    });

    describe('Claude installation', () => {
      const claudeClient: McpClient = {
        type: McpClientType.CLAUDE,
        name: 'claude',
      };

      it('should install server to Claude config', async () => {
        await service.installMcpServerToClient(claudeClient, baseInstallConfig);

        expect(fs.writeFileSync).toHaveBeenCalledWith(
          '/Users/test/Library/Application Support/Claude/claude_desktop_config.json',
          expect.any(String)
        );

        const writtenConfig = JSON.parse((fs.writeFileSync as jest.Mock).mock.calls[0][1]);
        expect(writtenConfig.mcpServers).toBeDefined();
        expect(Object.keys(writtenConfig.mcpServers)).toHaveLength(1);
      });

      it('should throw error if Claude config file not found', async () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);

        await expect(service.installMcpServerToClient(claudeClient, baseInstallConfig)).rejects.toThrow(
          'Claude config file not found'
        );
      });

      it('should handle Windows platform', async () => {
        (os.platform as jest.Mock).mockReturnValue('win32');

        await service.installMcpServerToClient(claudeClient, baseInstallConfig);

        expect(fs.writeFileSync).toHaveBeenCalledWith(
          '/Users/test/AppData/Claude/claude_desktop_config.json',
          expect.any(String)
        );
      });

      it('should throw error for unsupported platform', async () => {
        (os.platform as jest.Mock).mockReturnValue('linux');

        await expect(service.installMcpServerToClient(claudeClient, baseInstallConfig)).rejects.toThrow(
          'Unsupported platform'
        );
      });
    });

    describe('Cursor installation', () => {
      const cursorClient: McpClient = {
        type: McpClientType.CURSOR,
        name: 'cursor',
      };

      it('should install server to Cursor config', async () => {
        await service.installMcpServerToClient(cursorClient, baseInstallConfig);

        expect(fs.writeFileSync).toHaveBeenCalledWith('/Users/test/.cursor/mcp.json', expect.any(String));

        const writtenConfig = JSON.parse((fs.writeFileSync as jest.Mock).mock.calls[0][1]);
        expect(writtenConfig.mcpServers).toBeDefined();
        expect(Object.keys(writtenConfig.mcpServers)).toHaveLength(1);
      });

      it('should throw error if Cursor config file not found', async () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);

        await expect(service.installMcpServerToClient(cursorClient, baseInstallConfig)).rejects.toThrow(
          'Cursor config file not found'
        );
      });
    });
  });

  describe('newMcpClientService', () => {
    it('should create new instance', () => {
      const service = newMcpClientService(mockProfileService, mockSecretService, logger);
      expect(service).toBeInstanceOf(McpClientServiceImpl);
    });
  });
});
