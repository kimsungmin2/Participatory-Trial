import { Test, TestingModule } from '@nestjs/testing';
import { OnlineBoardsService } from './online_boards.service';

describe('OnlineBoardsService', () => {
  let service: OnlineBoardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnlineBoardsService],
    }).compile();

    service = module.get<OnlineBoardsService>(OnlineBoardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
