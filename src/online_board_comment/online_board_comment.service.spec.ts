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
import { ParamOnlineBoardComment } from './dto/param-online_board_comment.dto';
import { UpdateOnlineBoardCommentDto } from './dto/update-online_board_comment.dto';

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
      verifiCationCode: 1,
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
      top_comments: 'string',
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      OnlineBoardComment: null,
      onlineBoardLike: null,
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

    jest.spyOn(usersService, 'findByUserId').mockResolvedValue(userInfo);

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
      top_comments: 'string',
      createdAt: new Date('2024-03-24T02:05:02.602Z'),
      updatedAt: new Date('2024-03-24T02:05:02.602Z'),
      user: null,
      OnlineBoardComment: null,
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
    const paramOnlineBoardComment: ParamOnlineBoardComment = {
      onlineBoardId: 1,
      commentId: 1,
    };

    const updateOnlineBoardCommentDto: UpdateOnlineBoardCommentDto = {
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

    const foundBoard: OnlineBoards = {
      id: paramOnlineBoardComment.onlineBoardId,
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

    const foundUser: UserInfos = {
      id: userInfo.id,
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

    const foundComment: OnlineBoardComments = {
      id: paramOnlineBoardComment.commentId,
      onlineBoardId: paramOnlineBoardComment.onlineBoardId,
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

    jest
      .spyOn(onlineBoardsService, 'findBoardId')
      .mockResolvedValue(foundBoard);
    jest.spyOn(usersService, 'findByUserId').mockResolvedValue(foundUser);
    jest.spyOn(service, 'findCommentById').mockResolvedValue(foundComment);
    jest.spyOn(repository, 'update').mockResolvedValue(expectedResult);

    const result = await service.updateComment(
      paramOnlineBoardComment,
      updateOnlineBoardCommentDto,
      userInfo,
    );

    expect(result.affected).toBe(1);
  });

  it('should remove a board comment', async () => {
    const paramOnlineBoardComment: ParamOnlineBoardComment = {
      onlineBoardId: 1,
      commentId: 1,
    };

    const onlineBoard: OnlineBoards = {
      id: paramOnlineBoardComment.onlineBoardId,
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

    const onlineBoardComment: OnlineBoardComments = {
      id: paramOnlineBoardComment.commentId,
      onlineBoardId: paramOnlineBoardComment.onlineBoardId,
      content: 'content',
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: null,
      onlineBoard: null,
    };

    jest
      .spyOn(onlineBoardsService, 'findBoardId')
      .mockResolvedValue(onlineBoard);

    jest.spyOn(usersService, 'findByUserId').mockResolvedValue(userInfo);

    jest
      .spyOn(service, 'findCommentById')
      .mockResolvedValue(onlineBoardComment);

    jest.spyOn(repository, 'softDelete').mockResolvedValue(null);
  });

  it('should find comment by Id', async () => {
    const commentId: number = 1;

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
  });
});
