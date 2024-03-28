import { Test, TestingModule } from '@nestjs/testing';
import { PolticalDebatesController } from './poltical_debates.controller';
import { PolticalDebatesService } from './poltical_debates.service';

describe('PolticalDebatesController', () => {
  let controller: PolticalDebatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PolticalDebatesController],
      providers: [PolticalDebatesService],
    }).compile();

    controller = module.get<PolticalDebatesController>(PolticalDebatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
