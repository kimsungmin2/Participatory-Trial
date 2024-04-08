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
import { NotFoundException } from '@nestjs/common';

const files: Express.Multer.File[] = [];
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
      topComments: 'string',
      imageUrl: null,
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      OnlineBoardComment: null,
      onlineBoardLike: null,
    };

    jest.spyOn(usersService, 'findByUserId').mockResolvedValue(userInfo);

    jest.spyOn(repository, 'save').mockResolvedValue(expectedResult);

    const result = await service.createBoard(dto, userInfo, files);
    expect(result).toEqual(expectedResult);
  });

  it('should get all boards', async () => {
    const dto: FindAllOnlineBoardDto = {
      keyword: 'string',
    };

    const expectedResult: OnlineBoards[] = [
      {
        id: 1,
        userId: 1,
        title: dto.keyword,
        content: 'content',
        view: 1,
        like: 1,
        topComments: 'string',
        createdAt: new Date('2024-03-24T02:05:02.602Z'),
        updatedAt: new Date('2024-03-24T02:05:02.602Z'),
        user: null,
        OnlineBoardComment: null,
        onlineBoardLike: null,
      },
    ] as OnlineBoards[];

    jest.spyOn(repository, 'find').mockResolvedValue(expectedResult);

    const result = await service.findAllBoard(dto);
    expect(result).toEqual(expectedResult);
  });

  it('should get a board', async () => {
    const id: number = 1;

    const expectedResult: OnlineBoards = {
      id,
      userId: 1,
      title: 'title',
      content: 'content',
      view: 1,
      like: 1,
      topComments: 'string',
      imageUrl: null,
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      OnlineBoardComment: null,
      onlineBoardLike: null,
    };

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
      topComments: 'string',
      imageUrl: null,
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      OnlineBoardComment: null,
      onlineBoardLike: null,
    };

    const expectedResult: OnlineBoards = {
      id,
      userId: 1,
      title: 'title',
      content: 'content',
      view: 1,
      like: 1,
      imageUrl: null,
      topComments: 'string',
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      OnlineBoardComment: null,
      onlineBoardLike: null,
    };

    jest.spyOn(usersService, 'findByUserId').mockResolvedValue(userInfo);

    jest.spyOn(service, 'findBoardId').mockResolvedValue(onlineBoard);

    jest.spyOn(repository, 'save').mockResolvedValue(expectedResult);

    const result = await service.updateBoard(id, updateOnlineBoardDto);

    expect(result).toEqual(expectedResult);
  });

  // 게시 삭제

  it('should remove a board', async () => {
    const id = 2;

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

    const foundUser: UserInfos = {
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

    const foundBoard: OnlineBoards = {
      id,
      userId: 2,
      title: 'title',
      content: 'content',
      view: 1,
      like: 1,
      topComments: 'string',
      imageUrl: null,
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      OnlineBoardComment: null,
      onlineBoardLike: null,
    };

    jest.spyOn(usersService, 'findByUserId').mockResolvedValue(foundUser);
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
      topComments: 'string',
      imageUrl: null,
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      OnlineBoardComment: null,
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
