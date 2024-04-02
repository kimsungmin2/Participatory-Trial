import { Test, TestingModule } from '@nestjs/testing';
import { PolticalDebateCommentsController } from './poltical_debate_comments.controller';

describe('PolticalDebateCommentsController', () => {
  let controller: PolticalDebateCommentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PolticalDebateCommentsController],
    }).compile();

    controller = module.get<PolticalDebateCommentsController>(PolticalDebateCommentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
