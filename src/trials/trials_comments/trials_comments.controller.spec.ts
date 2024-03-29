import { Test, TestingModule } from '@nestjs/testing';
import { TrialsCommentsController } from './trials_comments.controller';
import { TrialsCommentsService } from './trials_comments.service';

describe('TrialsCommentsController', () => {
  let controller: TrialsCommentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrialsCommentsController],
      providers: [TrialsCommentsService],
    }).compile();

    controller = module.get<TrialsCommentsController>(TrialsCommentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
