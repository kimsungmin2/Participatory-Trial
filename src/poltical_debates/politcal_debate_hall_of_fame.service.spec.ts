import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PolticalDabateHallOfFameService } from './politcal_debate_hall_of_fame.service';
import { PolticalDebateBoards } from './entities/poltical_debate.entity';
import { PolticalDebateVotes } from './entities/polticalVote.entity';
import { PolticalDebateHallOfFame } from './entities/poltical_hall_of_fame.entity';
import { PolticalDebateBoardsViewHallOfFames } from './entities/polticalView_hall_of_fame.entity';
import { PolticalVotesService } from './poltical_debates_vote/poltical_debates_vote.service';
import { NotFoundException } from '@nestjs/common';

describe('TrialHallOfFameService', () => {
  let service: PolticalDabateHallOfFameService;
  let polticalRepository: Repository<PolticalDebateBoards>;
  let polticalVotesRepository: Repository<PolticalDebateVotes>;
  let polticalDebateHOFRepository: Repository<PolticalDebateHallOfFame>;
  let polticalDebateViewHOFRepository: Repository<PolticalDebateBoardsViewHallOfFames>;
  let dataSource: DataSource;

  const mockVoteQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getRawMany: jest
      .fn()
      .mockResolvedValue([
        { id: 1, title1: 'Option 1', title2: 'Option 2', totalVotes: 150 },
      ]),
  };
  const mockPolticalVoteRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => mockVoteQueryBuilder),
  };
  const mockPolticalsRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([
      {
        id: 1,
        title: 'Trial 1',
        content: 'Content 1',
        likes: 120,
        views: 150,
      },
    ]),
  };
  const mockQueryRunner = {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager: {
      save: jest.fn().mockImplementation(async (entity, data) => data),
      delete: jest.fn(),
    },
  };

  const mockPolticalVoteService = {
    updateVoteCounts: jest.fn(),
  };
  const mockPolticalDabateHallOfFamesRepository = {
    save: jest.fn(),
    count: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
  };
  const mockPolticalDabateHallOfViewFamesRepository = {
    save: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolticalDabateHallOfFameService,
        {
          provide: PolticalVotesService,
          useValue: mockPolticalVoteService,
        },
        {
          provide: getRepositoryToken(PolticalDebateBoards),
          useValue: mockPolticalsRepository,
        },
        {
          provide: getRepositoryToken(PolticalDebateVotes),
          useValue: mockPolticalVoteRepository,
        },
        {
          provide: getRepositoryToken(PolticalDebateHallOfFame),
          useValue: mockPolticalDabateHallOfFamesRepository,
        },
        {
          provide: getRepositoryToken(PolticalDebateBoardsViewHallOfFames),
          useValue: mockPolticalDabateHallOfViewFamesRepository,
        },
        {
          provide: DataSource,
          useValue: { createQueryRunner: jest.fn(() => mockQueryRunner) },
        },
      ],
    }).compile();

    service = module.get<PolticalDabateHallOfFameService>(PolticalDabateHallOfFameService);
    polticalRepository = module.get(getRepositoryToken(PolticalDebateBoards));
    polticalVotesRepository = module.get(getRepositoryToken(PolticalDebateVotes));
    polticalDebateHOFRepository = module.get(getRepositoryToken(PolticalDebateHallOfFame));
    polticalDebateViewHOFRepository = module.get(
      getRepositoryToken(PolticalDebateBoardsViewHallOfFames),
    );
    dataSource = module.get<DataSource>(DataSource);

    // jest
    //   .spyOn(service, 'updateHallOfFameDatabase')
    //   .mockImplementation(() => Promise.resolve());
    // jest
    //   .spyOn(service, 'updateLikeHallOfFameDatabase')
    //   .mockImplementation(() => Promise.resolve());
    // jest
    //   .spyOn(service, 'updateViewHallOfFameDatabase')
    //   .mockImplementation(() => Promise.resolve());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateHallOfFame', () => {
    it('should process hall of fame updates correctly', async () => {
      jest.spyOn(service, 'getLastWeekRange').mockReturnValue({
        start: new Date('2020-01-01'),
        end: new Date('2020-01-07'),
      });
      mockPolticalVoteRepository.find.mockResolvedValue([
        { id: 1, createdAt: new Date('2020-01-03'), voteCount: 10 },
      ]);
      mockPolticalsRepository.find.mockResolvedValue([
        {
          id: 1,
          createdAt: new Date('2020-01-03'),
          title: 'Trial 1',
          content: 'Content 1',
          like: 100,
          view: 150,
        },
      ]);

      jest
        .spyOn(service, 'aggVotesForHallOfFame')
        .mockResolvedValue([{ id: 1, voteCount: 10 }]);
      jest
        .spyOn(service, 'aggVotesViewForHallOfFame')
        .mockResolvedValue([{ id: 1, view: 150 }]);

      jest.spyOn(service, 'updateHallOfFameDatabase').mockResolvedValue(null);
      jest
        .spyOn(service, 'updateViewHallOfFameDatabase')
        .mockResolvedValue(null);

      await service.updatePolitcalHallOfFame();

      expect(polticalVotesRepository.find).toHaveBeenCalled();
      expect(polticalRepository.find).toHaveBeenCalled();
      expect(service.aggVotesForHallOfFame).toHaveBeenCalledWith(
        expect.any(Array),
      );
      expect(service.aggVotesViewForHallOfFame).toHaveBeenCalledWith(
        expect.any(Array),
      );
      expect(service.updateHallOfFameDatabase).toHaveBeenCalledWith(
        expect.any(Array),
      );
      expect(service.updateViewHallOfFameDatabase).toHaveBeenCalledWith(
        expect.any(Array),
      );
    });

    it('should handle errors gracefully', async () => {
        mockPolticalVoteRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.updatePolitcalHallOfFame()).rejects.toThrow();
    });
  });

  describe('getRecentHallOfFame', () => {
    it('should retrieve and paginate hall of fame entries correctly', async () => {
      const mockPaginationQueryDto = { page: 1, limit: 10 };
      mockPolticalDabateHallOfFamesRepository.find = jest.fn().mockResolvedValue([]);
      mockPolticalDabateHallOfFamesRepository.count = jest.fn().mockResolvedValue(0);

      const result = await service.getRecentHallOfFame(mockPaginationQueryDto);

      expect(mockPolticalDabateHallOfFamesRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { totalVotes: 'DESC' },
      });
      expect(result).toEqual({ trialHallOfFames: [], totalItems: 0 });
    });
  });
  describe('getViewRecentHallOfFame', () => {
    it('should retrieve view hall of fame entries with correct pagination', async () => {
      const paginationQueryDto = { page: 1, limit: 10 };
      const mockData = Array(10).fill({}); // 예시 데이터
      mockPolticalDabateHallOfViewFamesRepository.find.mockResolvedValue(mockData);
      mockPolticalDabateHallOfViewFamesRepository.count.mockResolvedValue(100);

      const result = await service.getViewRecentHallOfFame(paginationQueryDto);

      expect(mockPolticalDabateHallOfViewFamesRepository.find).toHaveBeenCalledWith({
        skip: 0, // (1-1) * 10
        take: 10,
        order: {
          total: 'DESC',
        },
      });
      expect(result.polticalDebateBoardsViewHallOfFames).toEqual(mockData);
      expect(result.totalItems).toEqual(100);
    });

    it('should handle errors correctly', async () => {
      const error = new Error('Database Error');
      mockPolticalDabateHallOfViewFamesRepository.find.mockRejectedValue(error);

      await expect(
        service.getViewRecentHallOfFame({ page: 1, limit: 10 }),
      ).rejects.toThrow('명예의 전당을 불러오는 도중 오류가 발생했습니다.');

      expect(mockPolticalDabateHallOfViewFamesRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: {
          total: 'DESC',
        },
      });
    });
  });

  describe('getThisMonthRange', () => {
    it('should return the correct start and end of the month', () => {
      const range = service.getThisMonthRange();

      expect(range.start.toISOString()).toBe('2024-04-30T15:00:00.000Z');

      expect(range.end.toISOString()).toBe('2024-05-31T14:59:59.999Z');
    });
  });
  describe('aggVotesViewForHallOfFame', () => {
    it('should aggregate votes view for hall of fame correctly', async () => {
      const result = await service.aggVotesViewForHallOfFame([]);
      expect(polticalRepository.createQueryBuilder).toBeCalledWith('trial');
      expect(mockQueryBuilder.getRawMany).toBeCalled();
      expect(result).toEqual([
        {
          id: 1,
          title: 'Trial 1',
          content: 'Content 1',
          likes: 120,
          views: 150,
        },
      ]);
      expect(mockQueryBuilder.where).toBeCalledWith(
        'polticalDebateBoard.createdAt BETWEEN :start AND :end',
        { start: expect.any(String), end: expect.any(String) },
      );
      expect(mockQueryBuilder.having).toBeCalledWith('views >= :minviews', {
        minviews: 100,
      });
      expect(mockQueryBuilder.orderBy).toBeCalledWith('views', 'DESC');
      expect(mockQueryBuilder.limit).toBeCalledWith(1000);
    });
  });
  describe('aggVotesVotesForHallOfFame', () => {
    it('should aggregate votes for hall of fame correctly', async () => {
      const result = await service.aggVotesForHallOfFame([]);

      expect(polticalVotesRepository.createQueryBuilder).toBeCalledWith('polticalDebateBoardVote');
      expect(mockVoteQueryBuilder.select).toHaveBeenCalledWith([
        'polticalDebateBoardVote.id',
        'polticalDebateBoardVote.title1',
        'polticalDebateBoardVote.title2',
        'polticalDebateBoards.userId',
        'polticalDebateBoards.content',
      ]);
      expect(mockVoteQueryBuilder.addSelect).toHaveBeenCalledWith(
        'polticalDebateBoardVote.voteCount1 + polticalDebateBoardVote.voteCount2',
        'total',
      );
      expect(mockVoteQueryBuilder.where).toHaveBeenCalledWith(
        'polticalDebateBoardVote.createdAt BETWEEN :start AND :end',
        { start: expect.any(String), end: expect.any(String) },
      );
      expect(mockVoteQueryBuilder.having).toHaveBeenCalledWith(
        'total >= :minTotalVotes',
        { minTotalVotes: 100 },
      );
      expect(mockVoteQueryBuilder.orderBy).toHaveBeenCalledWith(
        'total',
        'DESC',
      );
      expect(mockVoteQueryBuilder.limit).toHaveBeenCalledWith(1000);
      expect(mockVoteQueryBuilder.groupBy).toHaveBeenCalledWith('polticalDebateBoardVote.id');
      expect(mockVoteQueryBuilder.getRawMany).toHaveBeenCalled();
      expect(result).toEqual([
        { id: 1, title1: 'Option 1', title2: 'Option 2', totalVotes: 150 },
      ]);
    });
  });
  describe('updateHallOfFameDatabase', () => {
    const hallOfFameData = [
      {
        id: 1,
        trial: {
          userId: 1,
          content: 'Content 1',
        },
        title1: 'Option 1',
        title2: 'Option 2',
        voteCount1: 15,
        voteCount2: 15,
      },
      {
        id: 2,
        trial: {
          userId: 2,
          content: 'Content 2',
        },
        title1: 'Option 3',
        title2: 'Option 4',
        voteCount1: 10,
        voteCount2: 10,
      },
    ];

    it('should successfully save new hall of fame entries', async () => {
      await service.updateHallOfFameDatabase(hallOfFameData);

      const queryRunner = dataSource.createQueryRunner();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        PolticalDebateHallOfFame,
        expect.any(Array),
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    // it('should rollback transaction on error', async () => {
    //   mockQueryRunner.manager.save.mockRejectedValue(
    //     new Error('Failed to save'),
    //   );

    //   await expect(
    //     service.updateHallOfFameDatabase(hallOfFameData),
    //   ).rejects.toThrow('Failed to save');

    //   expect(mockQueryRunner.connect).toHaveBeenCalled();
    //   expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    //   expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    //   expect(mockQueryRunner.release).toHaveBeenCalled();
    // });

    it('should release resources after operation', async () => {
      await service.updateHallOfFameDatabase(hallOfFameData);

      const queryRunner = dataSource.createQueryRunner();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
  describe('updateViewHallOfFameDatabase', () => {
    const hallOfFameData = [
      { id: 1, userId: 1, title: 'Title 1', content: 'Content 1', views: 100 },
      { id: 2, userId: 2, title: 'Title 2', content: 'Content 2', views: 200 },
    ];

    it('should successfully save all entries and commit the transaction', async () => {
      await service.updateViewHallOfFameDatabase(hallOfFameData);

      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(
        PolticalDebateBoardsViewHallOfFames,
        {},
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        PolticalDebateBoardsViewHallOfFames,
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            userId: 1,
            title: 'Title 1',
            content: 'Content 1',
            total: 100,
          }),
          expect.objectContaining({
            id: 2,
            userId: 2,
            title: 'Title 2',
            content: 'Content 2',
            total: 200,
          }),
        ]),
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should release resources after operation', async () => {
      await service.updateViewHallOfFameDatabase(hallOfFameData);

      const queryRunner = dataSource.createQueryRunner();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
  describe('findOneBytrialHallofFameViews', () => {
    it('should return hall of fame entry when found', async () => {
      const mockEntry = { id: 1, name: 'Sample Hall of Fame', views: 150 };
      mockPolticalDabateHallOfViewFamesRepository.findOneBy.mockResolvedValue(mockEntry);

      const result = await service.findOneByPoliteHallofFameView(1);

      expect(mockPolticalDabateHallOfViewFamesRepository.findOneBy).toHaveBeenCalledWith(
        {
          id: 1,
        },
      );
      expect(result.OneHallOfPoliteView).toEqual(mockEntry);
    });

    it('should throw NotFoundException if entry is not found', async () => {
        mockPolticalDabateHallOfViewFamesRepository.findOneBy.mockResolvedValue(undefined);

      await expect(service.findOneByPoliteHallofFameView(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneByPoliteHallofFameView(999)).rejects.toThrow(
        `검색한 명예의 전당이 없습니다.999`,
      );
    });
  });

  describe('findOneBytrialHallofFameVote', () => {
    it('should return hall of fame entry when found', async () => {
      const mockEntry = { id: 1, name: 'Example Hall of Fame', votes: 150 };
      mockPolticalDabateHallOfFamesRepository.findOneBy.mockResolvedValue(mockEntry);

      const result = await service.findOneByPoliteHallofFameVote(1);

      expect(mockPolticalDabateHallOfFamesRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
      });
      expect(result.OneHallOfPoliteVote).toEqual(mockEntry);
    });

    it('should throw NotFoundException if entry is not found', async () => {
        mockPolticalDabateHallOfFamesRepository.findOneBy.mockResolvedValue(undefined);

      await expect(service.findOneByPoliteHallofFameVote(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneByPoliteHallofFameVote(999)).rejects.toThrow(
        '검색한 명예의 전당이 없습니다.',
      );
    });
  });
});
