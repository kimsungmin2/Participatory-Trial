import { Test, TestingModule } from '@nestjs/testing';
import { PolticalDebateCommentsService } from './poltical_debate_comments.service';

describe('PolticalDebateCommentsService', () => {
  let service: PolticalDebateCommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PolticalDebateCommentsService],
    }).compile();

    service = module.get<PolticalDebateCommentsService>(PolticalDebateCommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
