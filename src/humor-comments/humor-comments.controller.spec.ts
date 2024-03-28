import { Test, TestingModule } from '@nestjs/testing';
import { HumorCommentsController } from './humor-comments.controller';
import { HumorCommentsService } from './humor-comments.service';

describe('HumorCommentsController', () => {
  let controller: HumorCommentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HumorCommentsController],
      providers: [HumorCommentsService],
    }).compile();

    controller = module.get<HumorCommentsController>(HumorCommentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
