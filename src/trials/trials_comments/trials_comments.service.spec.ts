import { Test, TestingModule } from '@nestjs/testing';
import { TrialsCommentsService } from './trials_comments.service';

describe('TrialsCommentsService', () => {
  let service: TrialsCommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrialsCommentsService],
    }).compile();

    service = module.get<TrialsCommentsService>(TrialsCommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
