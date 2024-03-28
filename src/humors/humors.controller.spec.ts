import { Test, TestingModule } from '@nestjs/testing';
import { HumorsController } from './humors.controller';
import { HumorsService } from './humors.service';

describe('HumorsController', () => {
  let controller: HumorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HumorsController],
      providers: [HumorsService],
    }).compile();

    controller = module.get<HumorsController>(HumorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
