import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { SecretRefSource } from '@repo/shared/types/domain/secret';
import { SecretService } from './secret.service';

@Controller('secret')
export class SecretController {
  constructor(private readonly secretService: SecretService) {}

  @Post()
  async set(
    @Body() body: { sourceType: SecretRefSource; key: string; value: string },
  ) {
    return this.secretService.set(body.sourceType, body.key, body.value);
  }

  @Get(':sourceType')
  async list(@Param('sourceType') sourceType: SecretRefSource) {
    return this.secretService.list(sourceType);
  }

  @Get(':sourceType/:key')
  async get(
    @Param('sourceType') sourceType: SecretRefSource,
    @Param('key') key: string,
  ) {
    return this.secretService.get(sourceType, key);
  }

  @Delete(':sourceType/:key')
  async delete(
    @Param('sourceType') sourceType: SecretRefSource,
    @Param('key') key: string,
  ) {
    return this.secretService.delete(sourceType, key);
  }
}
