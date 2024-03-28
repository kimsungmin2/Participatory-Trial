import { Test, TestingModule } from '@nestjs/testing';
import { OnlineBoardsController } from './online_boards.controller';
import { OnlineBoardsService } from './online_boards.service';

describe('OnlineBoardsController', () => {
  let controller: OnlineBoardsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnlineBoardsController],
      providers: [OnlineBoardsService],
    }).compile();

    controller = module.get<OnlineBoardsController>(OnlineBoardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
