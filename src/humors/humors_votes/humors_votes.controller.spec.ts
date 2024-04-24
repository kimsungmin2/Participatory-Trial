import { Test, TestingModule } from '@nestjs/testing';
import { HumorVotesController } from './humors_votes.controller';
import { HumorVotesService } from './humors_votes.service';

describe('HumorsVotesController', () => {
  let controller: HumorVotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HumorVotesController],
      providers: [HumorVotesService],
    }).compile();

    controller = module.get<HumorVotesController>(HumorVotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
