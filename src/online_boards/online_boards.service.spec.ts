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
import { ForbiddenException } from '@nestjs/common';
import { Users } from '../users/entities/user.entity';
import { UserInfo } from 'os';

describe('OnlineBoardsService', () => {
  let service: OnlineBoardsService;
  let usersService: UsersService;
  let repository: Repository<OnlineBoards>;

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
    } as OnlineBoards;

    jest.spyOn(usersService, 'findByUserId').mockResolvedValue(userInfo);

    jest.spyOn(repository, 'save').mockResolvedValue(expectedResult);

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
        title: dto.keyword,
        content: 'content',
        view: 1,
        like: 1,
        top_comments: 'string',
        createdAt: new Date('2024-03-24T02:05:02.602Z'),
        updatedAt: new Date('2024-03-24T02:05:02.602Z'),
        user: null,
        OnlineBoardComment: null,
      },
    ] as OnlineBoards[];

    jest.spyOn(repository, 'find').mockResolvedValue(expectedResult);

    const result = await service.findAllBoard(dto);
    expect(result).toEqual(expectedResult);
  });

  it('should get a board', async () => {
    const id: number = 1;

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
    } as OnlineBoards;

    jest.spyOn(repository, 'findOne').mockResolvedValue(expectedResult);

    const result = await service.findBoard(id);
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
      verifiCationCode: 1,
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
      top_comments: 'string',
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      OnlineBoardComment: null,
    } as OnlineBoards;

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
    } as OnlineBoards;

    jest.spyOn(usersService, 'findByUserId').mockResolvedValue(userInfo);

    jest.spyOn(service, 'findBoardId').mockResolvedValue(onlineBoard);

    jest.spyOn(repository, 'save').mockResolvedValue(expectedResult);

    const result = await service.updateBoard(
      id,
      updateOnlineBoardDto,
      userInfo,
    );

    expect(result).toEqual(expectedResult);
  });
  // 보드 업데이트 예외 처리
  it('updateBoard 에외 처리', async () => {
    const id = 2;

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
      user: null,
    };

    const foundUser: UserInfos = {
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
      user: null,
    };

    const foundBoard: OnlineBoards = {
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
    } as OnlineBoards;

    jest.spyOn(usersService, 'findByUserId').mockResolvedValue(foundUser);

    jest.spyOn(service, 'findBoardId').mockResolvedValue(foundBoard);

    await expect(
      service.updateBoard(id, updateOnlineBoardDto, userInfo),
    ).rejects.toThrow(ForbiddenException);
  });
  // 여기가 게시 삭제
  it('should remove a board', async () => {
    const id = 2;

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
      user: null,
    };

    const foundUser: UserInfos = {
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
      user: null,
    };

    const foundBoard: OnlineBoards = {
      id,
      userId: 2,
      title: 'title',
      content: 'content',
      view: 1,
      like: 1,
      top_comments: 'string',
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      OnlineBoardComment: null,
    } as OnlineBoards;

    jest.spyOn(usersService, 'findByUserId').mockResolvedValue(foundUser);
    jest.spyOn(service, 'findBoardId').mockResolvedValue(foundBoard);
    jest.spyOn(repository, 'softDelete').mockResolvedValue(undefined);
    const result = await service.removeBoard(id, userInfo);

    expect(result).toEqual(`This action removes a #${id} onlineBoard`);
  });
  // 게시 삭제 예외 처리
  it('remove 예외처리', async () => {
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
      user: null,
    };

    const foundUser: UserInfos = {
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
      user: null,
    };

    const onlineBoard: OnlineBoards = {
      id,
      userId: 2,
      title: 'title',
      content: 'content',
      view: 1,
      like: 1,
      top_comments: 'string',
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      OnlineBoardComment: null,
    } as OnlineBoards;

    jest.spyOn(usersService, 'findByUserId').mockResolvedValue(foundUser);

    jest.spyOn(service, 'findBoardId').mockResolvedValue(onlineBoard);

    await expect(service.removeBoard(id, userInfo)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
