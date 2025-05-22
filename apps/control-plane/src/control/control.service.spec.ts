import { Test, TestingModule } from '@nestjs/testing';
import { ControlService } from './control.service';

describe('ControlService', () => {
  let service: ControlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ControlService],
    }).compile();

    service = module.get<ControlService>(ControlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
