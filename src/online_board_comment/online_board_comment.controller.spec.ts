import { Test, TestingModule } from '@nestjs/testing';
import { OnlineBoardCommentController } from './online_board_comment.controller';
import { OnlineBoardCommentService } from './online_board_comment.service';

describe('OnlineBoardCommentController', () => {
  let controller: OnlineBoardCommentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnlineBoardCommentController],
      providers: [OnlineBoardCommentService],
    }).compile();

    controller = module.get<OnlineBoardCommentController>(OnlineBoardCommentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
