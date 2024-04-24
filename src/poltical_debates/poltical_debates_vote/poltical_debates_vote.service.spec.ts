import { Test, TestingModule } from '@nestjs/testing';
import { PolticalVotesService } from './poltical_debates_vote.service';

describe('PolticalDebatesVoteService', () => {
  let service: PolticalVotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PolticalVotesService],
    }).compile();

    service = module.get<PolticalVotesService>(PolticalVotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
