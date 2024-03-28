import { Test, TestingModule } from '@nestjs/testing';
import { HumorsService } from './humors.service';

describe('HumorsService', () => {
  let service: HumorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HumorsService],
    }).compile();

    service = module.get<HumorsService>(HumorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
