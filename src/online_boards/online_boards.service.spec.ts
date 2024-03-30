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

describe('OnlineBoardsService', () => {
  let service: OnlineBoardsService;
  let usersService: UsersService;
  let onlineBoardsRepository: Repository<OnlineBoards>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnlineBoardsService,
        UsersService,
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
    onlineBoardsRepository = module.get<Repository<OnlineBoards>>(
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
      verifiCationCode: 1,
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
      view: 1,
      like: 1,
      top_comments: 'string',
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      OnlineBoardComment: null,
    };

    jest.spyOn(usersService, 'findByUserId').mockResolvedValue(userInfo);

    jest
      .spyOn(onlineBoardsRepository, 'save')
      .mockResolvedValue(expectedResult);

    const result = await service.createBoard(dto, userInfo);
    expect(result).toEqual(expectedResult);
  });

  it('should get all boards', async () => {
    const dto: FindAllOnlineBoardDto = {
      keyword: 'string',
    };

    const expectedResult = [
      {
        id: 1,
        userId: 1,
        title: 'title',
        content: 'content',
        view: 1,
        like: 1,
        top_comments: 'string',
        createdAt: new Date('2024-03-24T02:05:02.602Z'),
        updatedAt: new Date('2024-03-24T02:05:02.602Z'),
        user: null,
        OnlineBoardComment: null,
      },
    ];

    jest
      .spyOn(onlineBoardsRepository, 'find')
      .mockResolvedValue(expectedResult);
  });

  it('should get a board', async () => {
    const id = 1;

    const expectedResult = {
      id,
      userId: 1,
      title: 'title',
      content: 'content',
      view: 1,
      like: 1,
      top_comments: 'string',
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      OnlineBoardComment: null,
    };

    jest
      .spyOn(onlineBoardsRepository, 'findOne')
      .mockResolvedValue(expectedResult);
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
      verifiCationCode: 1,
      emailVerified: false,
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null, // 이 필드는 Users와의 관계를 가지므로, 테스트에서는 일반적으로 사용되지 않습니다.
    };
    const onlineBoard: OnlineBoards = {
      id,
      userId: 1,
      title: 'title',
      content: 'content',
      view: 1,
      like: 1,
      top_comments: 'string',
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      OnlineBoardComment: null,
    };
    const expectedResult = {
      id,
      userId: 1,
      title: 'title',
      content: 'content',
      view: 1,
      like: 1,
      top_comments: 'string',
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      OnlineBoardComment: null,
    };

    jest.spyOn(usersService, 'findByUserId').mockResolvedValue(userInfo);

    jest.spyOn(service, 'findBoardId').mockResolvedValue(onlineBoard);

    jest
      .spyOn(onlineBoardsRepository, 'save')
      .mockResolvedValue(expectedResult);
  });

  it('should remove a board', async () => {
    const id = 1;
    const userInfo: UserInfos = {
      id: 1,
      email: 'example@example.com',
      password: 'password123',
      nickName: 'JohnDoe',
      birth: '1990-01-01',
      provider: 'local',
      verifiCationCode: 1,
      emailVerified: false,
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null, // 이 필드는 Users와의 관계를 가지므로, 테스트에서는 일반적으로 사용되지 않습니다.
    };
    const onlineBoard: OnlineBoards = {
      id,
      userId: 1,
      title: 'title',
      content: 'content',
      view: 1,
      like: 1,
      top_comments: 'string',
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      OnlineBoardComment: null,
    };
    const expectedResult = null;

    jest.spyOn(usersService, 'findByUserId').mockResolvedValue(userInfo);

    jest.spyOn(service, 'findBoardId').mockResolvedValue(onlineBoard);

    jest
      .spyOn(onlineBoardsRepository, 'softDelete')
      .mockResolvedValue(expectedResult);
  });
});
