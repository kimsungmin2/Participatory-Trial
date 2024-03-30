import { Test, TestingModule } from '@nestjs/testing';
import { VotesController } from './vote.controller';
import { VotesService } from './vote.service';


describe('VoteController', () => {
  let controller: VotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotesController],
      providers: [VotesService],
    }).compile();

    controller = module.get<VotesController>(VotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
