import { Test, TestingModule } from '@nestjs/testing';
import { OnlineBoardCommentService } from './online_board_comment.service';

describe('OnlineBoardCommentService', () => {
  let service: OnlineBoardCommentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnlineBoardCommentService],
    }).compile();

    service = module.get<OnlineBoardCommentService>(OnlineBoardCommentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
