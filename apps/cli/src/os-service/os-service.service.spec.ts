import { Test, TestingModule } from '@nestjs/testing';
import { OsServiceService } from './os-service.service';

describe('OsServiceService', () => {
  let service: OsServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OsServiceService],
    }).compile();

    service = module.get<OsServiceService>(OsServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
