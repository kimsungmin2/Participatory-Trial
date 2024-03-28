import { Test, TestingModule } from '@nestjs/testing';
import { HumorCommentsService } from './humor-comments.service';

describe('HumorCommentsService', () => {
  let service: HumorCommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HumorCommentsService],
    }).compile();

    service = module.get<HumorCommentsService>(HumorCommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
