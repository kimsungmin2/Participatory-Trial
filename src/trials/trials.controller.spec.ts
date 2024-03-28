import { Test, TestingModule } from '@nestjs/testing';
import { TrialsController } from './trials.controller';
import { TrialsService } from './trials.service';

describe('TrialsController', () => {
  let controller: TrialsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrialsController],
      providers: [TrialsService],
    }).compile();

    controller = module.get<TrialsController>(TrialsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
