import { Test, TestingModule } from '@nestjs/testing';
import { OnlineBoardCommentService } from './online_board_comment.service';
import { OnlineBoardsService } from '../online_boards/online_boards.service';
import { UsersService } from '../users/users.service';
import { Repository, UpdateResult } from 'typeorm';
import { OnlineBoardComments } from './entities/online_board_comment.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { UserInfos } from '../users/entities/user-info.entity';
import { CreateOnlineBoardCommentDto } from './dto/create-online_board_comment.dto';
import { UpdateOnlineBoardCommentDto } from './dto/update-online_board_comment.dto';
import { S3Service } from '../s3/s3.service';
import { Users } from '../users/entities/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

const mockCacheManager = { set: jest.fn(), get: jest.fn(), del: jest.fn() };

describe('OnlineBoardCommentService', () => {
  let service: OnlineBoardCommentService;
  let onlineBoardsService: OnlineBoardsService;
  let usersService: UsersService;

  let repository: Repository<OnlineBoardComments>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnlineBoardCommentService,
        OnlineBoardsService,
        UsersService,
        {
          provide: getRepositoryToken(OnlineBoardComments),
          useClass: Repository,
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
          provide: getRepositoryToken(Users),
          useClass: Repository,
        },
        {
          provide: S3Service,
          useValue: {
            saveImages: jest.fn(),
          },
        },
        {
          provide: 'default_IORedisModuleConnectionToken',
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            incr: jest.fn().mockResolvedValue(1),
          },
        },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<OnlineBoardCommentService>(OnlineBoardCommentService);
    onlineBoardsService = module.get<OnlineBoardsService>(OnlineBoardsService);
    usersService = module.get<UsersService>(UsersService);
    repository = module.get<Repository<OnlineBoardComments>>(
      getRepositoryToken(OnlineBoardComments),
    );
  });

  it('should create board comment', async () => {
    const onlineBoardId: number = 1;

    const createOnlineBoardCommentDto: CreateOnlineBoardCommentDto = {
      content: '내용',
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
      id: onlineBoardId,
      userId: 1,
      title: 'title',
      content: createOnlineBoardCommentDto.content,
      view: 1,
      like: 1,
      topComments: 'string',
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updated_at: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      onlineBoardComment: null,
      onlineBoardLike: null,
      imageUrl: null,
      deleted_at: new Date('2024-03-24T02:05:02.602Z'),
    };

    const expectedValue: OnlineBoardComments = {
      id: 1,
      onlineBoardId: 1,
      content: 'content',
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: null,
      onlineBoard: null,
    };

    jest.spyOn(usersService, 'findById').mockResolvedValue(userInfo);

    jest
      .spyOn(onlineBoardsService, 'findBoardId')
      .mockResolvedValue(onlineBoard);

    jest.spyOn(repository, 'save').mockResolvedValue(expectedValue);

    const result = await service.createComment(
      onlineBoardId,
      createOnlineBoardCommentDto,
      userInfo,
    );

    expect(result).toEqual(expectedValue);
  });

  it('should find all board comments', async () => {
    const onlineBoardId = 1;

    const onlineBoard: OnlineBoards = {
      id: onlineBoardId,
      userId: 1,
      title: 'title',
      content: 'content',
      view: 1,
      like: 1,
      topComments: 'string',
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updated_at: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      onlineBoardComment: null,
      onlineBoardLike: null,
      imageUrl: null,
      deleted_at: new Date('2024-03-24T02:05:02.602Z'),
    };

    const expectedValue = [
      {
        id: 1,
        onlineBoardId: onlineBoardId,
        content: 'content',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: null,
        onlineBoard: null,
      },
    ];

    jest
      .spyOn(onlineBoardsService, 'findBoardId')
      .mockResolvedValue(onlineBoard);

    jest.spyOn(repository, 'findBy').mockResolvedValue(expectedValue);

    const result = await service.findAllComments(onlineBoardId);

    expect(result).toEqual(expectedValue);
  });

  it('should update a board comment', async () => {
    const commentId = 1;

    const updateOnlineBoardCommentDto: UpdateOnlineBoardCommentDto = {
      content: 'content',
    };

    const foundComment: OnlineBoardComments = {
      id: commentId,
      onlineBoardId: 1,

      content: 'content',
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: null,
      onlineBoard: null,
    };

    const expectedResult: UpdateResult = {
      raw: {},
      generatedMaps: [],
      affected: 1,
    };

    jest.spyOn(service, 'findCommentById').mockResolvedValue(foundComment);
    jest.spyOn(repository, 'update').mockResolvedValue(expectedResult);

    const result = await service.updateComment(
      commentId,
      updateOnlineBoardCommentDto,
    );

    expect(result.affected).toBe(1);
  });

  it('should remove a board comment', async () => {
    const commentId = 1;

    const onlineBoardComment: OnlineBoardComments = {
      id: commentId,
      onlineBoardId: 1,
      content: 'content',
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: null,
      onlineBoard: null,
    };

    jest
      .spyOn(service, 'findCommentById')
      .mockResolvedValue(onlineBoardComment);

    jest.spyOn(repository, 'softDelete').mockResolvedValue(undefined);
    const result = await service.removeComment(commentId);

    expect(result).toEqual(`This action removes a #${commentId} onlineBoard`);
  });

  it('should find comment by Id', async () => {
    const commentId = 1;

    const expectedValue: OnlineBoardComments = {
      id: commentId,
      onlineBoardId: 1,
      content: 'content',
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: null,
      onlineBoard: null,
    };

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(expectedValue);

    const result = await service.findCommentById(commentId);

    expect(result).toEqual(expectedValue);
  });
});
