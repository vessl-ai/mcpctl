import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { ServerService } from '../server/server.service';

@Injectable()
export class LogService {
  constructor(
    private readonly configService: ConfigService,
    private readonly serverService: ServerService,
  ) {}

  // Returns logs for a specific server instance
  async getServerInstanceLogs(params: {
    serverName: string;
    limit?: number;
  }): Promise<string[]> {
    const { serverName, limit } = params;
    const logDir = this.configService.get('app.logDir');
    const serverInstance =
      await this.serverService.getInstanceByName(serverName);
    if (!serverInstance) {
      throw new Error(`Server instance ${serverName} not found`);
    }
    const logFile = path.join(logDir, `${serverInstance.id}.log`);
    const log = fs.readFileSync(logFile, 'utf8');
    let lines = log.split('\n');
    if (limit) {
      lines = lines.slice(-limit);
    }
    return Promise.resolve(lines);
  }
}
