import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { LogService } from './log.service';

@Controller('log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get('server-instance')
  async getServerInstanceLogs(
    @Query('serverName') serverName: string,
    @Query('limit') limit?: string,
  ): Promise<string[]> {
    if (!serverName) {
      throw new NotFoundException('serverName is required');
    }
    try {
      const parsedLimit = limit ? parseInt(limit, 10) : undefined;
      return await this.logService.getServerInstanceLogs({
        serverName,
        limit: parsedLimit,
      });
    } catch (err) {
      throw new NotFoundException(err.message);
    }
  }
}
