import { Test, TestingModule } from '@nestjs/testing';
import { PolticalDebatesService } from './poltical_debates.service';

describe('PolticalDebatesService', () => {
  let service: PolticalDebatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PolticalDebatesService],
    }).compile();

    service = module.get<PolticalDebatesService>(PolticalDebatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
