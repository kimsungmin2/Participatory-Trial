import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { UpdateViewsScheduler } from './updateViews.sceduler';
import { HumorBoards } from '../humors/entities/humor-board.entity';
import { RedisService } from '../cache/redis.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';

const mockOnlineBoardRepository = {
  createQueryBuilder: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  })),
};
const mockScan: [string, string[]] = [
  '0',
  ['{humors}:1:view', '{humors}:2:view'],
];
const mockOnlineScan: [string, string[]] = [
  '0',
  ['{online}:1:view', '{online}:2:view'],
];

const mockValues = ['10', '20'];

describe('UpdateViewsScheduler', () => {
  let scheduler: UpdateViewsScheduler;
  let humorBoardRepository: Repository<HumorBoards>;
  let redisService: RedisService;
  let onlineBoardRepository: Repository<OnlineBoards>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateViewsScheduler,
        {
          provide: getRepositoryToken(HumorBoards),
          useValue: mockOnlineBoardRepository,
        },
        {
          provide: getRepositoryToken(OnlineBoards),
          useValue: mockOnlineBoardRepository,
        },

        {
          provide: RedisService,
          useValue: {
            getCluster: jest.fn().mockReturnValue({
              scan: jest.fn((cursor, matchOption, pattern) => {
                if (pattern === '{humors}:*:view') {
                  return Promise.resolve(mockScan);
                } else if (pattern === '{online}:*:view') {
                  return Promise.resolve(mockOnlineScan);
                }
              }),
              mget: jest.fn().mockResolvedValue(mockValues),
              del: jest.fn().mockResolvedValue(null),
            }),
          },
        },
      ],
    }).compile();

    scheduler = module.get<UpdateViewsScheduler>(UpdateViewsScheduler);
    humorBoardRepository = module.get<Repository<HumorBoards>>(
      getRepositoryToken(HumorBoards),
    );
    onlineBoardRepository = module.get<Repository<OnlineBoards>>(
      getRepositoryToken(OnlineBoards),
    );
    redisService = module.get(RedisService);
  });

  it('should be defined', () => {
    expect(scheduler).toBeDefined();
  });

  it('should update humor boards view counts', async () => {
    await scheduler.humorUpdateView();

    expect(redisService.getCluster().scan).toHaveBeenCalledWith(
      '0',
      'MATCH',
      '{humors}:*:view',
    );
    expect(redisService.getCluster().mget).toHaveBeenCalledWith(
      '{humors}:1:view',
      '{humors}:2:view',
    );
    expect(redisService.getCluster().del).toHaveBeenCalledWith(
      '{humors}:1:view',
    );
    expect(redisService.getCluster().del).toHaveBeenCalledWith(
      '{humors}:2:view',
    );
    expect(humorBoardRepository.createQueryBuilder).toHaveBeenCalledTimes(2);
  });
  it('should update online boards view counts', async () => {
    await scheduler.onlineUpdateView();

    expect(redisService.getCluster().scan).toHaveBeenCalledWith(
      '0',
      'MATCH',
      '{online}:*:view',
    );
    expect(redisService.getCluster().mget).toHaveBeenCalledWith(
      '{online}:1:view',
      '{online}:2:view',
    );
    expect(redisService.getCluster().del).toHaveBeenCalledWith(
      '{online}:1:view',
    );
    expect(redisService.getCluster().del).toHaveBeenCalledWith(
      '{online}:2:view',
    );
    expect(onlineBoardRepository.createQueryBuilder).toHaveBeenCalledTimes(4);
  });
});
