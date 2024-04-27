import { Test, TestingModule } from '@nestjs/testing';
import { PolticalVotesController } from './poltical_debates_vote.controller';
import { PolticalVotesService } from './poltical_debates_vote.service';


describe('PolticalVotesController', () => {
  let controller: PolticalVotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PolticalVotesController],
      providers: [PolticalVotesService],
    }).compile();

    controller = module.get<PolticalVotesController>(PolticalVotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
