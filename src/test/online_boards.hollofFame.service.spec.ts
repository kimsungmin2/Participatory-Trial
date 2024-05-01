import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { OnlineBoardLikeHallOfFames } from '../online_boards/entities/online_boardLike_of_fame.entity';
import { OnlineBoardViewHallOfFames } from '../online_boards/entities/online_boardVIew_of_fame.entity';
import { OnlineBoardHallOfFameService } from '../online_boards/online_boards.hollofFame.service';
import { PaginationQueryDto } from '../humors/dto/get-humorBoard.dto';

describe('OnlineHallOfFameService', () => {
  let service: OnlineBoardHallOfFameService;
  let onlineboardRepository: Repository<OnlineBoards>;
  let onlineboardLikeHOFRepository: Repository<OnlineBoardLikeHallOfFames>;
  let onlineboardViewHOFRepository: Repository<OnlineBoardViewHallOfFames>;
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

  const mockOnlineBoardRepository = {
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

  const mockOnlineBoardHallOfLikeFamesRepository = {
    save: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    findOneBy: jest.fn(),
  };
  const mockOnlineBoardHallOfViewFamesRepository = {
    save: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnlineBoardHallOfFameService,
        {
          provide: getRepositoryToken(OnlineBoards),
          useValue: mockOnlineBoardRepository,
        },
        {
          provide: getRepositoryToken(OnlineBoardLikeHallOfFames),
          useValue: mockOnlineBoardHallOfLikeFamesRepository,
        },
        {
          provide: getRepositoryToken(OnlineBoardViewHallOfFames),
          useValue: mockOnlineBoardHallOfViewFamesRepository,
        },
        {
          provide: DataSource,
          useValue: { createQueryRunner: jest.fn(() => mockQueryRunner) },
        },
      ],
    }).compile();

    service = module.get<OnlineBoardHallOfFameService>(
      OnlineBoardHallOfFameService,
    );
    onlineboardRepository = module.get(getRepositoryToken(OnlineBoards));
    onlineboardLikeHOFRepository = module.get(
      getRepositoryToken(OnlineBoardLikeHallOfFames),
    );
    onlineboardViewHOFRepository = module.get(
      getRepositoryToken(OnlineBoardViewHallOfFames),
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

  describe('updateHumorHallOfFame', () => {
    it('should process hall of fame updates correctly', async () => {
      jest.spyOn(service, 'getLastWeekRange').mockReturnValue({
        start: new Date('2020-01-01'),
        end: new Date('2020-01-07'),
      });
      mockOnlineBoardRepository.find.mockResolvedValue([
        {
          id: 1,
          createdAt: new Date('2020-01-03'),
          title: 'Humor 1',
          content: 'Content 1',
          like: 100,
          view: 150,
        },
      ]);

      jest
        .spyOn(service, 'aggVotesLikeForHallOfFame')
        .mockResolvedValue([{ id: 1, like: 100 }]);
      jest
        .spyOn(service, 'aggVotesViewForHallOfFame')
        .mockResolvedValue([{ id: 1, view: 150 }]);

      jest
        .spyOn(service, 'updateLikeHallOfFameDatabase')
        .mockResolvedValue(null);
      jest
        .spyOn(service, 'updateViewHallOfFameDatabase')
        .mockResolvedValue(null);

      await service.updateHumorHallOfFame();

      expect(onlineboardRepository.find).toHaveBeenCalled();

      expect(service.aggVotesLikeForHallOfFame).toHaveBeenCalledWith(
        expect.any(Array),
      );
      expect(service.aggVotesViewForHallOfFame).toHaveBeenCalledWith(
        expect.any(Array),
      );
      //   expect(service.updateLikeHallOfFameDatabase).toHaveBeenCalledWith(
      //     expect.any(Array),
      //   );
      //   expect(service.updateViewHallOfFameDatabase).toHaveBeenCalledWith(
      //     expect.any(Array),
      //   );
    });

    it('should handle errors gracefully', async () => {
      mockOnlineBoardRepository.find.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.updateHumorHallOfFame()).rejects.toThrow(
        'Database error',
      );
    });
  });

  //   describe('getLikeRecentHallOfFame', () => {
  //     it('should retrieve like hall of fame entries with correct pagination', async () => {
  //       const paginationQueryDto = { page: 1, limit: 10 };
  //       const mockData = Array(10).fill({}); // 예시 데이터
  //       mockOnlineBoardHallOfLikeFamesRepository.find.mockResolvedValue(mockData);
  //       mockOnlineBoardHallOfLikeFamesRepository.count.mockResolvedValue(100);

  //       const result = await service.getViewRecentHallOfFame(paginationQueryDto);
  //     });

  //     it('should handle errors correctly', async () => {
  //       const error = new Error('Database Error');
  //       mockOnlineBoardHallOfViewFamesRepository.find.mockRejectedValue(error);

  //       await expect(
  //         service.getViewRecentHallOfFame({ page: 1, limit: 10 }),
  //       ).rejects.toThrow('명예의 전당을 불러오는 도중오류가발생했습니다.');

  //       expect(
  //         mockOnlineBoardHallOfLikeFamesRepository.find,
  //       ).toHaveBeenCalledWith({
  //         skip: 0,
  //         take: 10,
  //         order: {
  //           total: 'DESC',
  //         },
  //       });
  //     });
  //   });
  describe('getViewRecentHallOfFame', () => {
    it('should retrieve view hall of fame entries with correct pagination', async () => {
      const paginationQueryDto = { page: 1, limit: 10 };
      const mockData = Array(10).fill({}); // 예시 데이터
      mockOnlineBoardHallOfViewFamesRepository.find.mockResolvedValue(mockData);
      mockOnlineBoardHallOfViewFamesRepository.count.mockResolvedValue(100);

      const result = await service.getViewRecentHallOfFame(paginationQueryDto);

      expect(
        mockOnlineBoardHallOfViewFamesRepository.find,
      ).toHaveBeenCalledWith({
        skip: 0, // (1-1) * 10
        take: 10,
        order: {
          total: 'DESC',
        },
      });
      expect(result.onlineBoardViewHallOfFames).toEqual(mockData);
      expect(result.totalItems).toEqual(100);
    });

    it('should handle errors correctly', async () => {
      const error = new Error('Database Error');
      mockOnlineBoardHallOfViewFamesRepository.find.mockRejectedValue(error);

      await expect(
        service.getViewRecentHallOfFame({ page: 1, limit: 10 }),
      ).rejects.toThrow('명예의 전당을 불러오는 도중오류가발생했습니다.');

      expect(
        mockOnlineBoardHallOfViewFamesRepository.find,
      ).toHaveBeenCalledWith({
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
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
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

      onlineboardRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.aggVotesLikeForHallOfFame([]);

      expect(onlineboardRepository.createQueryBuilder).toBeCalledWith(
        'onlineBoards',
      );
      expect(mockQueryBuilder.select).toBeCalled();
      expect(mockQueryBuilder.where).toBeCalledWith(
        'onlineBoards.createdAt BETWEEN :start AND :end',
        { start: expect.any(String), end: expect.any(String) },
      );
      expect(mockQueryBuilder.andWhere).toBeCalledWith(
        'onlineBoards.like >= :minlikes',
        {
          minlikes: 100,
        },
      );
      expect(mockQueryBuilder.orderBy).toBeCalledWith(
        'onlineBoards.likes',
        'DESC',
      );
      expect(mockQueryBuilder.limit).toBeCalledWith(1000);
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
      expect(onlineboardRepository.createQueryBuilder).toBeCalledWith(
        'onlineBoards',
      );
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
        OnlineBoardViewHallOfFames,
        {},
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        OnlineBoardViewHallOfFames,
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

  describe('updateLikeHallOfFameDatabase', () => {
    const hallOfFameData = [
      { id: 1, userId: 1, title: 'Title 1', content: 'Content 1', likes: 100 },
      { id: 2, userId: 2, title: 'Title 2', content: 'Content 2', likes: 200 },
    ];

    it('should successfully save all entries and commit the transaction', async () => {
      await service.updateLikeHallOfFameDatabase(hallOfFameData);

      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(
        OnlineBoardLikeHallOfFames,
        {},
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        OnlineBoardLikeHallOfFames,
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
      await service.updateLikeHallOfFameDatabase(hallOfFameData);

      const queryRunner = dataSource.createQueryRunner();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('findOneByHumorHallofFameViews', () => {
    it('should return hall of fame entry when found', async () => {
      const mockEntry = { id: 1, name: 'Sample Hall of Fame', views: 150 };
      mockOnlineBoardHallOfViewFamesRepository.findOneBy.mockResolvedValue(
        mockEntry,
      );

      const result = await service.findOneByOnlineHallofFameView(1);

      expect(
        mockOnlineBoardHallOfViewFamesRepository.findOneBy,
      ).toHaveBeenCalledWith({
        id: 1,
      });
      expect(result.OneHallOfOnlineView).toEqual(mockEntry);
    });

    it('should throw NotFoundException if entry is not found', async () => {
      mockOnlineBoardHallOfViewFamesRepository.findOneBy.mockResolvedValue(
        undefined,
      );

      await expect(service.findOneByOnlineHallofFameView(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneByOnlineHallofFameView(999)).rejects.toThrow(
        `검색한 명예의 전당이 없습니다.`,
      );
    });
  });
  describe('findOneByHumorHallofFameLikes', () => {
    it('should return hall of fame entry when found', async () => {
      const mockEntry = { id: 1, name: 'Sample Hall of Fame', likes: 150 };
      mockOnlineBoardHallOfViewFamesRepository.findOneBy.mockResolvedValue(
        mockEntry,
      );

      await service.findOneByOnlineHallofFameView(1);
    });

    it('should throw NotFoundException if entry is not found', async () => {
      mockOnlineBoardHallOfLikeFamesRepository.findOneBy.mockResolvedValue(
        undefined,
      );

      await expect(service.findOneByOnlineHallofFameLike(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneByOnlineHallofFameLike(999)).rejects.toThrow(
        `검색한 명예의 전당이 없습니다.`,
      );
    });
  });
  it('should return paginated like hall of fames', async () => {
    const paginationQueryDto: PaginationQueryDto = {
      page: 1,
      limit: 10,
    };
    const expectedTotalItems = 20;
    const expectedData = [
      { id: 1, total: 100 },
      { id: 2, total: 90 },
    ];

    mockOnlineBoardHallOfLikeFamesRepository.count.mockResolvedValue(
      expectedTotalItems,
    );
    mockOnlineBoardHallOfLikeFamesRepository.find.mockResolvedValue(
      expectedData,
    );

    const result = await service.getLikeRecentHallOfFame(paginationQueryDto);

    expect(mockOnlineBoardHallOfLikeFamesRepository.count).toHaveBeenCalled();
    expect(mockOnlineBoardHallOfLikeFamesRepository.find).toHaveBeenCalledWith({
      skip: (paginationQueryDto.page - 1) * paginationQueryDto.limit,
      take: paginationQueryDto.limit,
      order: { total: 'DESC' },
    });
    expect(result.totalItems).toBe(expectedTotalItems);
    expect(result.onlineBoardLikeHallOfFames).toEqual(expectedData);
  });

  it('should throw an error if an error occurs while fetching data', async () => {
    const paginationQueryDto: PaginationQueryDto = {
      page: 1,
      limit: 10,
    };
    const errorMessage = 'Database error';

    mockOnlineBoardHallOfLikeFamesRepository.count.mockRejectedValue(
      new Error(errorMessage),
    );

    await expect(
      service.getLikeRecentHallOfFame(paginationQueryDto),
    ).rejects.toThrow(new InternalServerErrorException('Database error'));
  });
});
