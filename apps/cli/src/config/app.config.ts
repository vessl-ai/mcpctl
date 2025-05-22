import { registerAs } from '@nestjs/config';
import * as os from 'os';
import * as path from 'path';
export interface AppConfig {
  controlPlaneBaseUrl: string;
  controlPlaneLogPath: string;
}

export default registerAs<AppConfig>('app', () => ({
  controlPlaneBaseUrl:
    process.env.CONTROL_PLANE_BASE_URL || `http://127.0.0.1:8999`,
  controlPlaneLogPath:
    process.env.CONTROL_PLANE_LOG_PATH ||
    path.join(os.homedir(), '.mcpctl', 'controlplane', 'logs'),
}));
