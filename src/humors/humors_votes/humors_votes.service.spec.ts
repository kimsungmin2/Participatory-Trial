import { Test, TestingModule } from '@nestjs/testing';
import { HumorsVotesService } from './humors_votes.service';

describe('HumorsVotesService', () => {
  let service: HumorsVotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HumorsVotesService],
    }).compile();

    service = module.get<HumorsVotesService>(HumorsVotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
