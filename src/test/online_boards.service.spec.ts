import { Repository } from 'typeorm';
import { OnlineBoardsService } from '../online_boards/online_boards.service';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { UsersService } from '../users/users.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateOnlineBoardDto } from '../online_boards/dto/create-online_board.dto';
import { UserInfos } from '../users/entities/user-info.entity';
import { FindAllOnlineBoardDto } from '../online_boards/dto/findAll-online_board.dto';
import { UpdateOnlineBoardDto } from '../online_boards/dto/update-online_board.dto';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Readable } from 'stream';
import { S3Service } from '../s3/s3.service';
import { RedisService } from '../cache/redis.service';
import { ConfigService } from '@nestjs/config';

describe('OnlineBoardsService', () => {
  let service: OnlineBoardsService;
  let usersService: UsersService;
  let repository: Repository<OnlineBoards>;

  const mockOnlineBoardsRepository = {
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    findOne: jest.fn(),
  };
  const mockRedisCluster = {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
  };

  const mockRedisService = {
    getCluster: jest.fn(() => mockRedisCluster),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockS3Service = {
    saveImages: jest
      .fn()
      .mockResolvedValue([
        { imageUrl: 'http://example.com/image1.jpg' },
        { imageUrl: 'http://example.com/image2.jpg' },
      ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnlineBoardsService,
        S3Service,
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: getRepositoryToken(OnlineBoards),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserInfos),
          useClass: Repository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('특정 설정 값'),
          },
        },
        {
          provide: getRepositoryToken(OnlineBoards),
          useValue: mockOnlineBoardsRepository,
        },
      ],
    }).compile();

    mockOnlineBoardsRepository.save.mockImplementation((board) =>
      Promise.resolve({
        ...board,
        id: 1,
        imageUrl: JSON.stringify([
          'http://example.com/image1.jpg',
          'http://example.com/image2.jpg',
        ]),
      }),
    );

    service = module.get<OnlineBoardsService>(OnlineBoardsService);
    service.findBoardId = jest.fn().mockResolvedValue({ id: 1 });
    usersService = module.get<UsersService>(UsersService);
    repository = module.get<Repository<OnlineBoards>>(
      getRepositoryToken(OnlineBoards),
    );
    mockOnlineBoardsRepository.count.mockResolvedValue(100); // 예를 들어 총 100개의 게시물이 있다고 가정
    mockOnlineBoardsRepository.find.mockResolvedValue([
      { id: 1, userId: 1, created_at: new Date() }, // 간단한 게시물 예제
      { id: 2, userId: 2, created_at: new Date() },
    ]);
    mockUsersService.findById.mockImplementation((userId) =>
      Promise.resolve({ id: userId, nickName: `User${userId}` }),
    );
  });
  it('should create a new board with images', async () => {
    const dto: CreateOnlineBoardDto = {
      title: 'Test Board',
      content: 'Test content',
    };
    const userInfo: UserInfos = {
      id: 1,
      email: 'example@example.com',
      password: 'password123',
      nickName: 'JohnDoe',
      birth: '1990-01-01',
      provider: 'local',
      emailVerified: false,
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
    };
    const files = [
      {
        fieldname: 'file',
        originalname: 'testfile.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 5000,
        destination: './uploads',
        filename: 'testfile.jpg',
        path: './uploads/testfile.jpg',
        buffer: Buffer.from('Test file content'),
        stream: Readable.from('Test file content'),
      },
    ];

    const result = await service.createBoard(dto, userInfo, files);

    expect(mockS3Service.saveImages).toHaveBeenCalledWith(files, 'onlineBoard');
    expect(mockOnlineBoardsRepository.save).toHaveBeenCalled();
    expect(result.imageUrl).toEqual(
      JSON.stringify([
        'http://example.com/image1.jpg',
        'http://example.com/image2.jpg',
      ]),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 1,
        title: 'Test Board',
        content: 'Test content',
        imageUrl: JSON.stringify([
          'http://example.com/image1.jpg',
          'http://example.com/image2.jpg',
        ]),
      }),
    );
  });

  it('should handle errors when saving the board', async () => {
    const dto: CreateOnlineBoardDto = {
      title: 'Failed Board',
      content: 'Should fail',
    };
    const userInfo: UserInfos = {
      id: 1,
      email: 'fail@example.com',
      password: 'password123',
      nickName: 'FailDoe',
      birth: '1990-01-01',
      provider: 'local',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: null,
    };
    const files = []; // No files provided

    mockOnlineBoardsRepository.save.mockRejectedValue(
      new Error('Database failure'),
    );

    await expect(service.createBoard(dto, userInfo, files)).rejects.toThrow(
      new InternalServerErrorException(
        '예기지 못한 오류로 게시물 생성에 실패했습니다. 다시 시도해주세요.',
      ),
    );
  });

  it('should get all boards', async () => {
    const keyword = 'keyword';
    const expectedResult: OnlineBoards[] = [
      {
        id: 1,
        userId: 1,
        title: keyword,
        content: 'content',
        view: 1,
        like: 1,
        topComments: 'string',
        created_at: new Date('2024-03-24T02:05:02.602Z'),
        updated_at: new Date('2024-03-24T02:05:02.602Z'),
        user: null,
        onlineBoardComment: null,
        onlineBoardLike: null,
      },
    ] as OnlineBoards[];

    jest.spyOn(repository, 'find').mockResolvedValue(expectedResult);

    const result = await service.findAllBoard(keyword);
    expect(result).toEqual(expectedResult);
  });

  it('should update a board', async () => {
    const id = 1;

    const updateOnlineBoardDto: UpdateOnlineBoardDto = {
      title: 'title',
      content: 'content',
    };

    const userInfo: UserInfos = {
      id: 1,
      email: 'example@example.com',
      password: 'password123',
      nickName: 'JohnDoe',
      birth: '1990-01-01',
      provider: 'local',
      emailVerified: false,
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
    };

    const onlineBoard: OnlineBoards = {
      id,
      userId: 1,
      title: 'title',
      content: 'content',
      view: 1,
      like: 1,
      imageUrl: 'image',
      topComments: 'string',
      created_at: new Date('2024-03-24T02:05:02.602Z'),
      updated_at: new Date('2024-03-24T02:05:02.602Z'),
      deleted_at: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      onlineBoardComment: null,
      onlineBoardLike: null,
    };

    const expectedResult: OnlineBoards = {
      id,
      userId: 1,
      title: 'title',
      content: 'content',
      view: 1,
      like: 1,
      imageUrl: 'image',
      topComments: 'string',
      created_at: new Date('2024-03-24T02:05:02.602Z'),
      updated_at: new Date('2024-03-24T02:05:02.602Z'),
      deleted_at: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      onlineBoardComment: null,
      onlineBoardLike: null,
    };

    jest.spyOn(service, 'findBoardId').mockResolvedValue(onlineBoard);

    jest.spyOn(repository, 'save').mockResolvedValue(expectedResult);

    const result = await service.updateBoard(id, updateOnlineBoardDto);

    expect(result).toEqual(expectedResult);
  });

  it('should remove a board and return a confirmation message', async () => {
    const boardId = 1;
    const expectedResult = `This action removes a #${boardId} onlineBoard`;

    const result = await service.removeBoard(boardId);

    expect(service.findBoardId).toHaveBeenCalledWith(boardId);
    expect(mockOnlineBoardsRepository.softDelete).toHaveBeenCalledWith({
      id: boardId,
    });
    expect(result).toEqual(expectedResult);
  });

  // 게시판 찾기
  it('should verify a board owner correctly', async () => {
    const userId = 1;
    const boardId = 100;
    const mockBoard = {
      id: boardId,
      userId: userId,
      title: 'My Board',
      content: 'Content here',
    };

    mockOnlineBoardsRepository.findOne.mockResolvedValue(mockBoard);

    const result = await service.verifyBoardOwner(userId, boardId);

    expect(mockOnlineBoardsRepository.findOne).toHaveBeenCalledWith({
      where: { userId, id: boardId },
    });
    expect(result).toEqual(mockBoard);
  });

  it('should return paginated boards with user names', async () => {
    const paginationQueryDto = { page: 1, limit: 10 };
    const result = await service.getPaginateBoards(paginationQueryDto);

    expect(mockOnlineBoardsRepository.count).toBeCalled();
    expect(mockOnlineBoardsRepository.find).toBeCalledWith({
      skip: 0,
      take: 10,
      order: { created_at: 'DESC' },
    });
    expect(result.onlineBoards).toHaveLength(2);
    expect(result.onlineBoards[0].userName).toBe('User1');
    expect(result.onlineBoards[1].userName).toBe('User2');
    expect(result.totalItems).toBe(100);
  });

  it('should handle errors', async () => {
    mockOnlineBoardsRepository.find.mockRejectedValue(
      new Error('Database failure'),
    );
    const paginationQueryDto = { page: 1, limit: 10 };

    await expect(service.getPaginateBoards(paginationQueryDto)).rejects.toThrow(
      '게시물을 불러오는 도중 오류가 발생했습니다.',
    );
  });
  it('should find a board by ID and return it with its comments', async () => {
    const boardId = 1;
    const expectedBoard = {
      id: boardId,
      title: 'Test Board',
      content: 'Test Content',
      onlineBoardComment: [
        {
          id: 1,
          comment: 'Great Post!',
        },
      ],
    };

    mockOnlineBoardsRepository.findOne.mockResolvedValue(expectedBoard);

    const result = await service.findBoard(boardId);

    expect(mockOnlineBoardsRepository.findOne).toHaveBeenCalledWith({
      where: { id: boardId },
      relations: { onlineBoardComment: true },
    });
    expect(result).toEqual(expectedBoard);
  });
  it('should find an online board and increase its view count', async () => {
    const boardId = 1;
    const initialView = 10;
    const cachedView = 5;
    const expectedBoard = {
      id: boardId,
      view: initialView,
      onlineBoardComment: [],
    };

    mockOnlineBoardsRepository.findOne.mockResolvedValue(expectedBoard);
    mockRedisCluster.incr.mockResolvedValue(cachedView);

    const result = await service.findOneOnlineBoardWithIncreaseView(boardId);

    expect(mockOnlineBoardsRepository.findOne).toHaveBeenCalledWith({
      where: { id: boardId },
      relations: ['onlineBoardComment'],
    });
    expect(mockRedisService.getCluster().incr).toHaveBeenCalledWith(
      `online:${boardId}:view`,
    );
    expect(result.view).toEqual(initialView + cachedView);
  });

  it('should throw NotFoundException if board does not exist', async () => {
    const boardId = 2;
    mockOnlineBoardsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.findOneOnlineBoardWithIncreaseView(boardId),
    ).rejects.toThrow(
      new NotFoundException(`${boardId}번 게시물을 찾을 수 없습니다.`),
    );
  });

  it('should handle Redis errors', async () => {
    const boardId = 3;
    const expectedBoard = {
      id: boardId,
      view: 20,
      onlineBoardComment: [],
    };

    mockOnlineBoardsRepository.findOne.mockResolvedValue(expectedBoard);
    mockRedisCluster.incr.mockRejectedValue(new Error('Redis error'));

    await expect(
      service.findOneOnlineBoardWithIncreaseView(boardId),
    ).rejects.toThrow(
      new InternalServerErrorException(
        '요청을 처리하는 도중 오류가 발생했습니다.',
      ),
    );
  });
});
