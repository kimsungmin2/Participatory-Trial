import { Test, TestingModule } from '@nestjs/testing';
import { HumorVotesService } from './humors_votes.service';

describe('HumorsVotesService', () => {
  let service: HumorVotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HumorVotesService],
    }).compile();

    service = module.get<HumorVotesService>(HumorVotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
