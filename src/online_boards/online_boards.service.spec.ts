import { Repository } from 'typeorm';
import { OnlineBoardsService } from './online_boards.service';
import { OnlineBoards } from './entities/online_board.entity';
import { UsersService } from '../users/users.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateOnlineBoardDto } from './dto/create-online_board.dto';
import { UserInfos } from '../users/entities/user-info.entity';
import { FindAllOnlineBoardDto } from './dto/findAll-online_board.dto';
import { UpdateOnlineBoardDto } from './dto/update-online_board.dto';
import { NotFoundException } from '@nestjs/common';
import { Readable } from 'stream';
import { S3Service } from '../s3/s3.service';
import { RedisService } from '../cache/redis.service';
import Redis from 'ioredis';

describe('OnlineBoardsService', () => {
  let service: OnlineBoardsService;
  let usersService: UsersService;
  let redisService: RedisService;
  let repository: Repository<OnlineBoards>;
  const files: Express.Multer.File[] = [
    {
      fieldname: 'file',
      originalname: 'testfile.txt',
      encoding: '7bit',
      mimetype: 'text/plain',
      size: 128,
      destination: './upload',
      filename: 'testfile.txt',
      path: './upload/testfile.txt',
      buffer: Buffer.from('Hello World'),
      stream: Readable.from(Buffer.from('Hello World')),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnlineBoardsService,
        S3Service,
        UsersService,
        RedisService,
        {
          provide: getRepositoryToken(OnlineBoards),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserInfos),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<OnlineBoardsService>(OnlineBoardsService);
    usersService = module.get<UsersService>(UsersService);
    redisService = module.get<RedisService>(RedisService);
    repository = module.get<Repository<OnlineBoards>>(
      getRepositoryToken(OnlineBoards),
    );
  });

  it('should create a new board', async () => {
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
      user: null, // 이 필드는 Users와의 관계를 가지므로, 테스트에서는 일반적으로 사용되지 않습니다.
    };

    const expectedResult: OnlineBoards = {
      id: 1,
      userId: 1,
      title: 'title',
      content: 'content',
      imageUrl: 'string',
      view: 1,
      like: 1,
      topComments: 'string',
      created_at: new Date('2024-03-24T02:05:02.602Z'),
      updated_at: new Date('2024-03-24T02:05:02.602Z'),
      deleted_at: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      onlineBoardComment: null,
      onlineBoardLike: null,
    };

    jest.spyOn(repository, 'save').mockResolvedValue(expectedResult);

    const result = await service.createBoard(dto, userInfo, files);
    expect(result).toEqual(expectedResult);
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

  it('should get a board and increase view', async () => {
    const id: number = 1;

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

    // const cluster = new Redis.Cluster(
    //   [
    //     {
    //       host: process.env.REDIS_HOST_1,
    //       port: parseInt(process.env.REDIS_PORT_1, 10),
    //     },
    //     {
    //       host: process.env.REDIS_HOST_2,
    //       port: parseInt(process.env.REDIS_PORT_2, 10),
    //     },
    //     {
    //       host: process.env.REDIS_HOST_3,
    //       port: parseInt(process.env.REDIS_PORT_3, 10),
    //     },
    //   ],
    //   {
    //     natMap: {
    //       '172.20.0.2:6380': {
    //         host: process.env.REDIS_HOST,
    //         port: parseInt(process.env.REDIS_PORT_1),
    //       },
    //       '172.20.0.3:6381': {
    //         host: process.env.REDIS_HOST,
    //         port: parseInt(process.env.REDIS_PORT_2),
    //       },
    //       '172.20.0.4:6382': {
    //         host: process.env.REDIS_HOST,
    //         port: parseInt(process.env.REDIS_PORT_3),
    //       },
    //       '172.20.0.5:6383': {
    //         host: process.env.REDIS_HOST,
    //         port: parseInt(process.env.REDIS_PORT_4),
    //       },
    //       '172.20.0.6:6384': {
    //         host: process.env.REDIS_HOST,
    //         port: parseInt(process.env.REDIS_PORT_5),
    //       },
    //       '172.20.0.7:6385': {
    //         host: process.env.REDIS_HOST,
    //         port: parseInt(process.env.REDIS_PORT_6),
    //       },
    //     },
    //     scaleReads: 'slave',
    //   },
    // );

    let cachedView: number;
    const cluster = redisService.getCluster();
    const result = await service.findBoard(id);

    jest.spyOn(repository, 'findOne').mockResolvedValue(expectedResult);
    jest.spyOn(redisService, 'getCluster').mockReturnValue(cluster);
    expect(result).toEqual(expectedResult);
    expect(cluster).toBeInstanceOf(Redis.Cluster);
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

  // 게시 삭제

  it('should remove a board', async () => {
    const id = 2;

    const foundBoard: OnlineBoards = {
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

    jest.spyOn(service, 'findBoardId').mockResolvedValue(foundBoard);
    jest.spyOn(repository, 'softDelete').mockResolvedValue(undefined);
    const result = await service.removeBoard(id);

    expect(result).toEqual(`This action removes a #${id} onlineBoard`);
  });

  // 게시판 찾기
  it('should find a board and verify board owner', async () => {
    const boardId: number = 1;

    const expectedValue: OnlineBoards = {
      id: boardId,
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

    jest.spyOn(repository, 'findOne').mockResolvedValue(expectedValue);
    const result = await service.findBoardId(boardId);

    expect(result).toEqual(expectedValue);
  });

  it('should throw Not Found Exception', async () => {
    const boardId = 1;
    const expectedValue = null;

    jest.spyOn(repository, 'findOne').mockResolvedValue(expectedValue);

    await expect(service.findBoardId(boardId)).rejects.toThrow(
      new NotFoundException('해당 게시물이 존재하지 않습니다.'),
    );
  });
});
