import { Test, TestingModule } from '@nestjs/testing';
import { HumorsVotesController } from './humors_votes.controller';
import { HumorsVotesService } from './humors_votes.service';

describe('HumorsVotesController', () => {
  let controller: HumorsVotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HumorsVotesController],
      providers: [HumorsVotesService],
    }).compile();

    controller = module.get<HumorsVotesController>(HumorsVotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
