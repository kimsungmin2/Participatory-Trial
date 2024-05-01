import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TrialHallOfFameService } from '../trials/trial_hall_of_fame.service';
import { Trials } from '../trials/entities/trial.entity';
import { Votes } from '../trials/entities/vote.entity';
import { TrialHallOfFames } from '../trials/entities/trial_hall_of_fame.entity';
import { TrialLikeHallOfFames } from '../trials/entities/trail_hall_of_fame.like.entity';
import { TrialViewHallOfFames } from '../trials/entities/trial_hall_of_fame.view.entity';
import { VotesService } from './vote/vote.service';

describe('TrialHallOfFameService', () => {
  let service: TrialHallOfFameService;
  let trialsRepository: Repository<Trials>;
  let votesRepository: Repository<Votes>;
  let trialHOFRepository: Repository<TrialHallOfFames>;
  let trialLikeHOFRepository: Repository<TrialLikeHallOfFames>;
  let trialViewHOFRepository: Repository<TrialViewHallOfFames>;
  let dataSource: DataSource;

  const mockVoteQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest
      .fn()
      .mockResolvedValue([
        { id: 1, title1: 'Option 1', title2: 'Option 2', totalVotes: 150 },
      ]),
  };
  const mockVoteRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => mockVoteQueryBuilder),
  };
  const mockTrialsRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
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
    },
  };

  const mockVoteService = {
    updateVoteCounts: jest.fn(),
  };
  const mockTrialHallOfFamesRepository = {
    save: jest.fn(),
    count: jest.fn(),
    find: jest.fn(),
  };
  const mockTrialHallOfLikeFamesRepository = {
    save: jest.fn(),
    find: jest.fn(),
  };
  const mockTrialHallOfViewFamesRepository = {
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrialHallOfFameService,
        {
          provide: VotesService,
          useValue: mockVoteService,
        },
        {
          provide: getRepositoryToken(Trials),
          useValue: mockTrialsRepository,
        },
        {
          provide: getRepositoryToken(Votes),
          useValue: mockVoteRepository,
        },
        {
          provide: getRepositoryToken(TrialHallOfFames),
          useValue: mockTrialHallOfFamesRepository,
        },
        {
          provide: getRepositoryToken(TrialLikeHallOfFames),
          useValue: mockTrialHallOfLikeFamesRepository,
        },
        {
          provide: getRepositoryToken(TrialViewHallOfFames),
          useValue: mockTrialHallOfViewFamesRepository,
        },
        {
          provide: DataSource,
          useValue: { createQueryRunner: jest.fn(() => mockQueryRunner) },
        },
      ],
    }).compile();

    service = module.get<TrialHallOfFameService>(TrialHallOfFameService);
    trialsRepository = module.get(getRepositoryToken(Trials));
    votesRepository = module.get(getRepositoryToken(Votes));
    trialHOFRepository = module.get(getRepositoryToken(TrialHallOfFames));
    trialLikeHOFRepository = module.get(
      getRepositoryToken(TrialLikeHallOfFames),
    );
    trialViewHOFRepository = module.get(
      getRepositoryToken(TrialViewHallOfFames),
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
      mockVoteRepository.find.mockResolvedValue([
        { id: 1, createdAt: new Date('2020-01-03'), voteCount: 10 },
      ]);
      mockTrialsRepository.find.mockResolvedValue([
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

      await service.updateHallOfFame();

      expect(votesRepository.find).toHaveBeenCalled();
      expect(trialsRepository.find).toHaveBeenCalled();
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
      mockVoteRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.updateHallOfFame()).rejects.toThrow();
    });
  });

  describe('getRecentHallOfFame', () => {
    it('should retrieve and paginate hall of fame entries correctly', async () => {
      const mockPaginationQueryDto = { page: 1, limit: 10 };
      mockTrialHallOfFamesRepository.find = jest.fn().mockResolvedValue([]);
      mockTrialHallOfFamesRepository.count = jest.fn().mockResolvedValue(0);

      const result = await service.getRecentHallOfFame(mockPaginationQueryDto);

      expect(mockTrialHallOfFamesRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { totalVotes: 'DESC' },
      });
      expect(result).toEqual({ trialHallOfFames: [], totalItems: 0 });
    });
  });
  describe('getLikeRecentHallOfFame', () => {
    it('should retrieve like hall of fame entries', async () => {
      mockTrialHallOfLikeFamesRepository.find = jest.fn().mockResolvedValue([]);

      const result = await service.getLikeRecentHallOfFame();

      expect(mockTrialHallOfLikeFamesRepository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
  describe('getViewRecentHallOfFame', () => {
    it('should retrieve view hall of fame entries', async () => {
      mockTrialHallOfViewFamesRepository.find = jest.fn().mockResolvedValue([]);

      const result = await service.getViewRecentHallOfFame();

      expect(mockTrialHallOfViewFamesRepository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
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
      expect(trialsRepository.createQueryBuilder).toBeCalled();
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
      expect(trialsRepository.createQueryBuilder).toBeCalledWith('trial');
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
        'trial.createdAt BETWEEN :start AND :end',
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

      expect(votesRepository.createQueryBuilder).toBeCalledWith('vote');
      expect(mockVoteQueryBuilder.select).toHaveBeenCalledWith([
        'vote.id',
        'vote.title1',
        'vote.title2',
      ]);
      expect(mockVoteQueryBuilder.addSelect).toHaveBeenCalledWith(
        'vote.voteCount1 + vote.voteCount2',
        'totalVotes',
      );
      expect(mockVoteQueryBuilder.where).toHaveBeenCalledWith(
        'vote.createdAt BETWEEN :start AND :end',
        { start: expect.any(String), end: expect.any(String) },
      );
      expect(mockVoteQueryBuilder.having).toHaveBeenCalledWith(
        'totalVotes >= :minTotalVotes',
        { minTotalVotes: 100 },
      );
      expect(mockVoteQueryBuilder.orderBy).toHaveBeenCalledWith(
        'totalVotes',
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
        TrialHallOfFames,
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
      { id: 1, userId: 1, title: 'Title 1', content: 'Content 1', like: 10 },
      { id: 2, userId: 2, title: 'Title 2', content: 'Content 2', like: 20 },
    ];

    it('should successfully save all entries and commit the transaction', async () => {
      await service.updateViewHallOfFameDatabase(hallOfFameData);

      const queryRunner = dataSource.createQueryRunner();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        TrialViewHallOfFames,
        expect.any(Array),
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    // it('should rollback the transaction on error', async () => {
    //   const queryRunner = dataSource.createQueryRunner();
    //   queryRunner.manager.save.mockRejectedValue(new Error('Database error'));

    //   await expect(
    //     service.updateViewHallOfFameDatabase(hallOfFameData),
    //   ).rejects.toThrow('Database error');

    //   expect(queryRunner.connect).toHaveBeenCalled();
    //   expect(queryRunner.startTransaction).toHaveBeenCalled();
    //   expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    //   expect(queryRunner.release).toHaveBeenCalled();
    // });

    it('should release resources after operation', async () => {
      await service.updateViewHallOfFameDatabase(hallOfFameData);

      const queryRunner = dataSource.createQueryRunner();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});
