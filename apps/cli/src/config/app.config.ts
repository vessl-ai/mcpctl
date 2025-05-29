import { registerAs } from '@nestjs/config';
import * as os from 'os';
import * as path from 'path';
export interface AppConfig {
  controlPlaneBaseUrl: string;
  controlPlaneLogPath: string;
  claudeMcpJsonFilePath: string;
  cursorMcpJsonFilePath: string;
}

export default registerAs<AppConfig>('app', () => ({
  controlPlaneBaseUrl:
    process.env.CONTROL_PLANE_BASE_URL || `http://127.0.0.1:8999`,
  controlPlaneLogPath:
    process.env.CONTROL_PLANE_LOG_PATH ||
    path.join(os.homedir(), '.mcpctl', 'controlplane', 'logs'),
  claudeMcpJsonFilePath:
    process.env.CLAUDE_MCP_JSON_FILE_PATH || os.platform() === 'darwin'
      ? path.join(
          os.homedir(),
          'Library',
          'Application Support',
          'Claude',
          'claude_desktop_config.json',
        )
      : os.platform() === 'win32'
        ? path.join(
            process.env.APPDATA || '',
            'Claude',
            'claude_desktop_config.json',
          )
        : path.join(
            os.homedir(),
            '.config',
            'claude',
            'claude_desktop_config.json',
          ),
  cursorMcpJsonFilePath:
    process.env.CURSOR_MCP_JSON_FILE_PATH ||
    path.join(os.homedir(), '.cursor', 'mcp.json'),
}));
