import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { HumorHallOfFameService } from './hall_of_fameOfHumor';
import { HumorBoards } from './entities/humor-board.entity';
import { HumorVotes } from './entities/HumorVote.entity';
import { HumorsHallOfFame } from './entities/humor_hall_of_fame.entity';
import { HumorsLikeHallOfFames } from './entities/humor_hall_of_fame.like.entity';
import { HumorsViewHallOfFames } from './entities/humor_hall_of_fame.view.entity';
import { HumorVotesService } from './humors_votes/humors_votes.service';
import { NotFoundException } from '@nestjs/common';



describe('HumorHallOfFameService', () => {
  let service: HumorHallOfFameService;
  let humorsRepository: Repository<HumorBoards>;
  let humorsvoteRepository: Repository<HumorVotes>;
  let humorHOFRepository: Repository<HumorsHallOfFame>;
  let humorLikeHOFRepository: Repository<HumorsLikeHallOfFames>;
  let humorViewHOFRepository: Repository<HumorsViewHallOfFames>;
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
  const mockHumorVoteRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => mockVoteQueryBuilder),
  };
  const mockHumorRepository = {
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
        title: 'Humor 1',
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

  const mockHumorVoteService = {
    updateVoteCounts: jest.fn(),
  };
  const mockHumorHallOfFamesRepository = {
    save: jest.fn(),
    count: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
  };
  const mockHumorHallOfLikeFamesRepository = {
    save: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    findOneBy: jest.fn(),
  };
  const mockHumorHallOfViewFamesRepository = {
    save: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HumorHallOfFameService,
        {
          provide: HumorVotesService,
          useValue: mockHumorVoteService,
        },
        {
          provide: getRepositoryToken(HumorBoards),
          useValue: mockHumorRepository,
        },
        {
          provide: getRepositoryToken(HumorVotes),
          useValue: mockHumorVoteRepository,
        },
        {
          provide: getRepositoryToken(HumorsHallOfFame),
          useValue: mockHumorHallOfFamesRepository,
        },
        {
          provide: getRepositoryToken(HumorsLikeHallOfFames),
          useValue: mockHumorHallOfLikeFamesRepository,
        },
        {
          provide: getRepositoryToken(HumorsViewHallOfFames),
          useValue: mockHumorHallOfViewFamesRepository,
        },
        {
          provide: DataSource,
          useValue: { createQueryRunner: jest.fn(() => mockQueryRunner) },
        },
      ],
    }).compile();

    service = module.get<HumorHallOfFameService>(HumorHallOfFameService);
    humorsRepository = module.get(getRepositoryToken(HumorBoards));
    humorsvoteRepository = module.get(getRepositoryToken(HumorVotes));
    humorHOFRepository = module.get(getRepositoryToken(HumorsHallOfFame));
    humorLikeHOFRepository = module.get(
      getRepositoryToken(HumorsLikeHallOfFames),
    );
    humorViewHOFRepository = module.get(
      getRepositoryToken(HumorsViewHallOfFames),
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
      mockHumorVoteRepository.find.mockResolvedValue([
        { id: 1, createdAt: new Date('2020-01-03'), voteCount: 10 },
      ]);
      mockHumorRepository.find.mockResolvedValue([
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
        .spyOn(service, 'aggVotesLikeForHallOfFame')
        .mockResolvedValue([{ id: 1, like: 100 }]);
      jest
        .spyOn(service, 'aggVotesViewForHallOfFame')
        .mockResolvedValue([{ id: 1, view: 150 }]);

      jest.spyOn(service, 'updateHallOfFameDatabase').mockResolvedValue(null);
      jest
        .spyOn(service, 'updateLikeHallOfFameDatabase')
        .mockResolvedValue(null);
      jest
        .spyOn(service, 'updateViewHallOfFameDatabase')
        .mockResolvedValue(null);

      await service.updateHumorHallOfFame();

      expect(humorsvoteRepository.find).toHaveBeenCalled();
      expect(humorsRepository.find).toHaveBeenCalled();
      expect(service.aggVotesForHallOfFame).toHaveBeenCalledWith(
        expect.any(Array),
      );
      expect(service.aggVotesLikeForHallOfFame).toHaveBeenCalledWith(
        expect.any(Array),
      );
      expect(service.aggVotesViewForHallOfFame).toHaveBeenCalledWith(
        expect.any(Array),
      );
      expect(service.updateHallOfFameDatabase).toHaveBeenCalledWith(
        expect.any(Array),
      );
      expect(service.updateLikeHallOfFameDatabase).toHaveBeenCalledWith(
        expect.any(Array),
      );
      expect(service.updateViewHallOfFameDatabase).toHaveBeenCalledWith(
        expect.any(Array),
      );
    });

    it('should handle errors gracefully', async () => {
        mockHumorVoteRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.updateHumorHallOfFame()).rejects.toThrow();
    });
  });

  describe('getRecentHallOfFame', () => {
    it('should retrieve and paginate hall of fame entries correctly', async () => {
      const mockPaginationQueryDto = { page: 1, limit: 10 };
      mockHumorHallOfFamesRepository.find = jest.fn().mockResolvedValue([]);
      mockHumorHallOfFamesRepository.count = jest.fn().mockResolvedValue(0);

      const result = await service.getRecentHallOfFame(mockPaginationQueryDto);

      expect(mockHumorHallOfFamesRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { totalVotes: 'DESC' },
      });
      expect(result).toEqual({ trialHallOfFames: [], totalItems: 0 });
    });
  });
  describe('getLikeRecentHallOfFame', () => {
    it('should retrieve like hall of fame entries with correct pagination', async () => {
      const paginationQueryDto = { page: 2, limit: 10 };
      const mockData = Array(10).fill({}); // 예시 데이터
      mockHumorHallOfLikeFamesRepository.find.mockResolvedValue(mockData);
      mockHumorHallOfLikeFamesRepository.count.mockResolvedValue(100);

      const result = await service.getLikeRecentHallOfFame(paginationQueryDto);

      expect(mockHumorHallOfLikeFamesRepository.find).toHaveBeenCalledWith({
        skip: 10, // (2-1) * 10
        take: 10,
        order: {
          total: 'DESC',
        },
      });
      expect(result.humorsLikeHallOfFames).toEqual(mockData);
      expect(result.totalItems).toEqual(100);
    });

    it('should handle errors correctly', async () => {
        mockHumorHallOfLikeFamesRepository.find.mockRejectedValue(
        new Error('Database Error'),
      );

      await expect(
        service.getLikeRecentHallOfFame({ page: 1, limit: 10 }),
      ).rejects.toThrow('명예의 전당을 불러오는 도중 오류가 발생했습니다.');
    });
  });
  
  describe('getViewRecentHallOfFame', () => {
    it('should retrieve view hall of fame entries with correct pagination', async () => {
      const paginationQueryDto = { page: 1, limit: 10 };
      const mockData = Array(10).fill({}); // 예시 데이터
      mockHumorHallOfViewFamesRepository.find.mockResolvedValue(mockData);
      mockHumorHallOfViewFamesRepository.count.mockResolvedValue(100);

      const result = await service.getViewRecentHallOfFame(paginationQueryDto);

      expect(mockHumorHallOfViewFamesRepository.find).toHaveBeenCalledWith({
        skip: 0, // (1-1) * 10
        take: 10,
        order: {
          total: 'DESC',
        },
      });
      expect(result.humorsViewHallOfFames).toEqual(mockData);
      expect(result.totalItems).toEqual(100);
    });

    it('should handle errors correctly', async () => {
      const error = new Error('Database Error');
      mockHumorHallOfViewFamesRepository.find.mockRejectedValue(error);

      await expect(
        service.getViewRecentHallOfFame({ page: 1, limit: 10 }),
      ).rejects.toThrow('명예의 전당을 불러오는 도중 오류가 발생했습니다.');

      expect(mockHumorHallOfViewFamesRepository.find).toHaveBeenCalledWith({
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
  describe('aggVotesLikeForHallOfFame', () => {
    it('should aggregate votes like for hall of fame correctly', async () => {
      const result = await service.aggVotesLikeForHallOfFame([]);
      expect(humorsRepository.createQueryBuilder).toBeCalled();
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
    });
  });
  describe('aggVotesViewForHallOfFame', () => {
    it('should aggregate votes view for hall of fame correctly', async () => {
      const result = await service.aggVotesViewForHallOfFame([]);
      expect(humorsRepository.createQueryBuilder).toBeCalledWith('humorboard');
      expect(mockQueryBuilder.getRawMany).toBeCalled();
      expect(result).toEqual([
        {
          id: 1,
          title: 'Humor 1',
          content: 'Content 1',
          likes: 120,
          views: 150,
        },
      ]);
      expect(mockQueryBuilder.where).toBeCalledWith(
        'humor.createdAt BETWEEN :start AND :end',
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

      expect(humorsvoteRepository.createQueryBuilder).toBeCalledWith('humorVote');
      expect(mockVoteQueryBuilder.select).toHaveBeenCalledWith([
        'humorVote.id',
        'humorVote.title1',
        'humorVote.title2',
        'trial.userId',
        'trial.content',
      ]);
      expect(mockVoteQueryBuilder.addSelect).toHaveBeenCalledWith(
        'humorVote.voteCount1 + humorVote.voteCount2',
        'total',
      );
      expect(mockVoteQueryBuilder.where).toHaveBeenCalledWith(
        'humorVote.createdAt BETWEEN :start AND :end',
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
      expect(mockVoteQueryBuilder.groupBy).toHaveBeenCalledWith('vote.id');
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
        humor: {
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
        humor: {
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
        HumorsHallOfFame,
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

    it('should release resources after operation', async () => {
      await service.updateLikeHallOfFameDatabase(hallOfFameData);

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
        HumorsViewHallOfFames,
        {},
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        HumorsViewHallOfFames,
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
  describe('findOneByHumorHallofFameViews', () => {
    it('should return hall of fame entry when found', async () => {
      const mockEntry = { id: 1, name: 'Sample Hall of Fame', views: 150 };
      mockHumorHallOfViewFamesRepository.findOneBy.mockResolvedValue(mockEntry);

      const result = await service.findOneByhumorHallofFameViews(1);

      expect(mockHumorHallOfViewFamesRepository.findOneBy).toHaveBeenCalledWith(
        {
          id: 1,
        },
      );
      expect(result.OneHallOfTrialViews).toEqual(mockEntry);
    });

    it('should throw NotFoundException if entry is not found', async () => {
      mockHumorHallOfViewFamesRepository.findOneBy.mockResolvedValue(undefined);

      await expect(service.findOneByhumorHallofFameViews(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneByhumorHallofFameViews(999)).rejects.toThrow(
        `검색한 명예의 전당이 없습니다.999`,
      );
    });
  });
  describe('findOneBytrialHallofFameLike', () => {
    it('should return hall of fame entry when found', async () => {
      const mockEntry = { id: 1, name: 'Sample Hall of Fame', likes: 100 };
      mockHumorHallOfLikeFamesRepository.findOneBy.mockResolvedValue(mockEntry);

      const result = await service.findOneByhumorHallofFameLike(1);

      expect(mockHumorHallOfLikeFamesRepository.findOneBy).toHaveBeenCalledWith(
        { id: 1 },
      );
      expect(result.OneHallOfHumorLikes).toEqual(mockEntry);
    });

    it('should throw NotFoundException if entry is not found', async () => {
        mockHumorHallOfLikeFamesRepository.findOneBy.mockResolvedValue(undefined);

      await expect(service.findOneByhumorHallofFameLike(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneByhumorHallofFameLike(999)).rejects.toThrow(
        '검색한 명예의 전당이 없습니다.',
      );
    });
  });
  describe('findOneBytrialHallofFameVote', () => {
    it('should return hall of fame entry when found', async () => {
      const mockEntry = { id: 1, name: 'Example Hall of Fame', votes: 150 };
      mockHumorHallOfFamesRepository.findOneBy.mockResolvedValue(mockEntry);

      const result = await service.findOneByhumorHallofFameVote(1);

      expect(mockHumorHallOfFamesRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
      });
      expect(result.OneHallOfHumorVote).toEqual(mockEntry);
    });

    it('should throw NotFoundException if entry is not found', async () => {
        mockHumorHallOfFamesRepository.findOneBy.mockResolvedValue(undefined);

      await expect(service.findOneByhumorHallofFameVote(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneByhumorHallofFameVote(999)).rejects.toThrow(
        '검색한 명예의 전당이 없습니다.',
      );
    });
  });
});