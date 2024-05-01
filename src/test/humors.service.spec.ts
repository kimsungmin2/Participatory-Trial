import { Test, TestingModule } from '@nestjs/testing';
import { HumorsService } from '../humors/humors.service';
import { Role } from '../users/types/userRole.type';
import { UserInfos } from '../users/entities/user-info.entity';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { Trials } from '../trials/entities/trial.entity';
import { HumorBoards } from '../humors/entities/humor-board.entity';

import { PolticalDebateBoards } from '../poltical_debates/entities/poltical_debate.entity';
import { PolticalDebateComments } from '../poltical_debates/entities/poltical_debate_comments.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  EntityTarget,
  QueryRunner,
  Repository,
  UpdateResult,
} from 'typeorm';
import { CreateHumorBoardDto } from '../humors/dto/create-humor.dto';
import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateHumorDto } from '../humors/dto/update-humor.dto';
import { S3Service } from '../s3/s3.service';
import { Users } from '../users/entities/user.entity';
import { OnlineBoardComments } from '../online_board_comment/entities/online_board_comment.entity';
import { HumorVotes } from '../humors/entities/HumorVote.entity';
import { VoteTitleDto } from '../trials/vote/dto/voteDto';
import { Readable } from 'stream';
import { EachHumorVote } from '../humors/entities/UservoteOfHumorVote.entity';
import { RedisService } from '../cache/redis.service';
import { UsersService } from '../users/users.service';
import { connect } from 'http2';

const mockedUser: Users = {
  id: 1,
  role: Role.User,
  createdAt: new Date(),
  updatedAt: new Date(),
  userInfo: new UserInfos(),
  onlineBoard: [new OnlineBoards()],
  onlineBoardComment: [new OnlineBoardComments()],
  trial: [new Trials()],
  humorBoard: [new HumorBoards()],
  polticalDebateBoards: [new PolticalDebateBoards()],
  polticalDebateComments: [new PolticalDebateComments()],
  humorLike: [],
  onlineBoardLike: [],
  eachVote: [],
  eachHumorVote: [],
  eachPolticalVote: [],
  trialsChat: [],
};
const mockBoard = {
  id: 1,
  content: '냠냠',
  userId: 1,
  like: 1,
  view: 1,
  createdAt: new Date(),
  updated_at: new Date(),
  deleted_at: new Date(),
} as HumorBoards;

const mockVote = {
  humorId: 1,
  title1: '냠냠',
  title2: '냠냠2',
} as HumorVotes;

const mockFile: Express.Multer.File[] = [
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

class ConnectionMock {
  createQueryRunner = jest.fn(() => {
    const qr = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        getRepository: jest.fn().mockImplementation((entity) => {
          if (entity === HumorBoards) {
            return { save: jest.fn().mockResolvedValue(mockBoard) };
          } else if (entity === HumorVotes) {
            return { save: jest.fn().mockResolvedValue(mockVote) };
          }
          return {};
        }),
      },
    };
    return qr;
  });
}

describe('HumorsService', () => {
  let humorService: HumorsService;
  let humorBoardRepository: Repository<HumorBoards>;
  let humorVoteRepository: Repository<HumorVotes>;
  let eachHumorVoteRepository: Repository<EachHumorVote>;
  let s3Service: S3Service;
  let redisService: RedisService;
  let usersService: UsersService;
  let dataSource: DataSource;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HumorsService,
        S3Service,
        {
          provide: S3Service,
          useValue: {
            saveImages: jest.fn().mockResolvedValue([
              {
                imageUrl: 'hello',
              },
            ]),
          },
        },

        {
          provide: getRepositoryToken(HumorBoards),
          useValue: {
            findOneBy: jest.fn(),
            save: jest.fn(),
            findBy: jest.fn(),
            findOne: jest.fn(),
            merge: jest.fn(),
            delete: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            softDelete: jest.fn(),
          },
        },

        {
          provide: getRepositoryToken(HumorVotes),
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EachHumorVote),
          useClass: Repository,
        },
        {
          provide: RedisService,
          useValue: {
            getCluster: jest.fn().mockReturnValue({
              incr: jest.fn().mockResolvedValue(1),
            }),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useClass: ConnectionMock,
        },
      ],
    }).compile();

    humorService = module.get<HumorsService>(HumorsService);
    s3Service = module.get<S3Service>(S3Service);
    dataSource = module.get<DataSource>(DataSource);
    redisService = module.get<RedisService>(RedisService);
    usersService = module.get<UsersService>(UsersService);
    humorBoardRepository = module.get<Repository<HumorBoards>>(
      getRepositoryToken(HumorBoards),
    );
    humorVoteRepository = module.get<Repository<HumorVotes>>(
      getRepositoryToken(HumorVotes),
    );
    eachHumorVoteRepository = module.get<Repository<EachHumorVote>>(
      getRepositoryToken(EachHumorVote),
    );
    jest
      .spyOn(dataSource, 'createQueryRunner')
      .mockReturnValue(dataSource.createQueryRunner());
  });

  it('should be defined', () => {
    expect(humorService).toBeDefined();
    expect(s3Service).toBeDefined();
    expect(dataSource).toBeDefined();
    expect(redisService).toBeDefined();
    expect(usersService).toBeDefined();
  });
  describe('createHumorBoardAndVotes', () => {
    const createHumorBoardDto: CreateHumorBoardDto = {
      content: '냠냠',
      title: '냠냠냠',
    };
    const voteTitleDto: VoteTitleDto = {
      title1: '냠냠',
      title2: '냠냠2',
    };
    const files: Express.Multer.File[] = [];
    it('must be success', async () => {
      await humorService.createHumorBoardAndVotes(
        createHumorBoardDto,
        voteTitleDto,
        mockedUser,
        files,
      );
      expect(dataSource.createQueryRunner).toHaveBeenCalledTimes(2);
      const qr = dataSource.createQueryRunner();
      expect(qr.connect).toHaveBeenCalledTimes(1); // connect 호출 검증
      expect(qr.startTransaction).toHaveBeenCalledTimes(1); // startTransaction 호출 검증
    });
    it('must be success with image', async () => {
      const mockedUrl = [
        {
          imageUrl: 'hello',
        },
      ];
      const mockBoard1 = {
        id: 1,
        content: '냠냠',
        userId: 1,
        like: 1,
        view: 1,
        createdAt: new Date(),
        updated_at: new Date(),
        deleted_at: new Date(),
        imageUrl: '[hello]',
      } as HumorBoards;
      const createdBoard = await humorService.createHumorBoardAndVotes(
        createHumorBoardDto,
        voteTitleDto,
        mockedUser,
        mockFile,
      );
      expect(dataSource.createQueryRunner).toHaveBeenCalledTimes(2);
      const qr = dataSource.createQueryRunner();
      expect(qr.connect).toHaveBeenCalledTimes(1); // connect 호출 검증
      expect(qr.startTransaction).toHaveBeenCalledTimes(1); // startTransaction 호출 검증
    });
  });
  describe('getAllHumorBoards', () => {
    const count: number = 3;
    const result = {
      humorBoards: [
        {
          id: 1,
          userName: '김라임',
        },
      ],
      totalItems: count,
    };
    const mockBoardArray = [
      {
        id: 1,
      },
    ] as HumorBoards[];
    const mockNickName = {
      nickName: '김라임',
    } as UserInfos;
    const PaginationQueryDto = {
      limit: 1,
      page: 1,
    };
    it('must be success', async () => {
      jest
        .spyOn(humorBoardRepository, 'find')
        .mockResolvedValue(mockBoardArray);
      jest.spyOn(humorBoardRepository, 'count').mockResolvedValue(count);
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockNickName);
      const createdBoard =
        await humorService.getAllHumorBoards(PaginationQueryDto);
      expect(humorBoardRepository.find).toHaveBeenCalledTimes(1);
      expect(humorBoardRepository.count).toHaveBeenCalledTimes(1);
      expect(usersService.findById).toHaveBeenCalledTimes(1);
      expect(createdBoard).toEqual(result);
    });
    it('must be find is failed', async () => {
      expect.assertions(3);
      jest.spyOn(humorBoardRepository, 'find').mockRejectedValue(new Error());
      try {
        const createdBoard =
          await humorService.getAllHumorBoards(PaginationQueryDto);
      } catch (err) {
        expect(err).toBeInstanceOf(InternalServerErrorException);
        expect(err.message).toEqual(
          '게시물을 불러오는 도중 오류가 발생했습니다.',
        );
      }
      expect(humorBoardRepository.find).toHaveBeenCalledTimes(1);
    });
  });
  describe('findOneHumorBoard', () => {
    it('must be success', async () => {
      jest
        .spyOn(humorBoardRepository, 'findOneBy')
        .mockResolvedValue(mockBoard);
      const createdBoard = await humorService.findOneHumorBoard(mockBoard.id);
      expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
      expect(createdBoard).toEqual(mockBoard);
    });
    it('must be failed by NotFoundException', async () => {
      jest.spyOn(humorBoardRepository, 'findOneBy').mockResolvedValue(null);
      try {
        await humorService.findOneHumorBoard(mockBoard.id);
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
        expect(err.message).toEqual(`1번 게시물을 찾을 수 없습니다.`);
      }
      expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
    });
  });
  describe('findOneHumorBoardWithIncreaseView', () => {
    const mockBoardRedis = {
      id: 1,
      content: '냠냠',
      userId: 1,
      like: 1,
      view: 2,
      createdAt: new Date(),
      updated_at: new Date(),
      deleted_at: new Date(),
    } as HumorBoards;
    it('must be success', async () => {
      jest
        .spyOn(humorBoardRepository, 'findOne')
        .mockResolvedValue(mockBoardRedis);
      const createdBoard = await humorService.findOneHumorBoardWithIncreaseView(
        mockBoard.id,
      );
      mockBoardRedis.view = 3;
      expect(humorBoardRepository.findOne).toHaveBeenCalledTimes(1);
      expect(createdBoard).toEqual(mockBoardRedis);
    });
    it('must be failed by NotFoundException', async () => {
      jest.spyOn(humorBoardRepository, 'findOne').mockResolvedValue(null);
      try {
        await humorService.findOneHumorBoardWithIncreaseView(mockBoard.id);
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
        expect(err.message).toEqual(`1번 게시물을 찾을 수 없습니다.`);
      }
      expect(humorBoardRepository.findOne).toHaveBeenCalledTimes(1);
    });
  });
  describe('updateHumorBoard', () => {
    const updateHumorDto = {
      title: 'title',
      content: 'content',
    } as UpdateHumorDto;
    const mergeData = {
      ...mockBoard,
      ...updateHumorDto,
    };
    it('must be success', async () => {
      jest
        .spyOn(humorService, 'findOneHumorBoard')
        .mockResolvedValue(mockBoard);
      jest.spyOn(humorBoardRepository, 'merge').mockReturnValue(mergeData);
      jest.spyOn(humorBoardRepository, 'save').mockResolvedValue(mergeData);

      const createdBoard = await humorService.updateHumorBoard(
        mockBoard.id,
        updateHumorDto,
        mockedUser,
      );
      expect(humorService.findOneHumorBoard).toHaveBeenCalledTimes(1);
      expect(humorBoardRepository.merge).toHaveBeenCalledTimes(1);
      expect(humorBoardRepository.save).toHaveBeenCalledTimes(1);
      expect(createdBoard).toEqual(mergeData);
    });
    it('must be failed by ForbiddenException', async () => {
      expect.assertions(4);
      const wrongUserBoard = {
        userId: 100,
      } as HumorBoards;
      jest
        .spyOn(humorService, 'findOneHumorBoard')
        .mockResolvedValue(wrongUserBoard);
      try {
        const createdBoard = await humorService.updateHumorBoard(
          mockBoard.id,
          updateHumorDto,
          mockedUser,
        );
      } catch (err) {
        expect(err).toBeInstanceOf(ForbiddenException);
      }
      expect(humorService.findOneHumorBoard).toHaveBeenCalledTimes(1);
      expect(humorBoardRepository.merge).toHaveBeenCalledTimes(0);
      expect(humorBoardRepository.save).toHaveBeenCalledTimes(0);
    });
    it('must be failed by InternalServerErrorException', async () => {
      expect.assertions(4);
      jest
        .spyOn(humorService, 'findOneHumorBoard')
        .mockResolvedValue(mockBoard);
      jest.spyOn(humorBoardRepository, 'merge').mockReturnValue(mergeData);
      jest.spyOn(humorBoardRepository, 'save').mockRejectedValue(new Error());
      try {
        const createdBoard = await humorService.updateHumorBoard(
          mockBoard.id,
          updateHumorDto,
          mockedUser,
        );
      } catch (err) {
        expect(err).toBeInstanceOf(InternalServerErrorException);
      }
      expect(humorService.findOneHumorBoard).toHaveBeenCalledTimes(1);
      expect(humorBoardRepository.merge).toHaveBeenCalledTimes(1);
      expect(humorBoardRepository.save).toHaveBeenCalledTimes(1);
    });
  });
  describe('deleteHumorBoard', () => {
    const deletedResult: UpdateResult = {
      affected: 1,
    } as UpdateResult;
    const failedDeletedResult: UpdateResult = {
      affected: 0,
    } as UpdateResult;
    it('must be success', async () => {
      jest
        .spyOn(humorService, 'findOneHumorBoard')
        .mockResolvedValue(mockBoard);
      jest
        .spyOn(humorBoardRepository, 'softDelete')
        .mockResolvedValue(deletedResult);

      const deletedBoard = await humorService.deleteHumorBoard(
        mockBoard.id,
        mockedUser,
      );
      expect(humorService.findOneHumorBoard).toHaveBeenCalledTimes(1);
      expect(humorBoardRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(deletedBoard).toEqual(deletedResult);
    });
    it('must be failed by ForbiddenException', async () => {
      expect.assertions(3);
      const wrongUserBoard = {
        userId: 100,
      } as HumorBoards;
      jest
        .spyOn(humorService, 'findOneHumorBoard')
        .mockResolvedValue(wrongUserBoard);
      try {
        await humorService.deleteHumorBoard(mockBoard.id, mockedUser);
      } catch (err) {
        expect(err).toBeInstanceOf(ForbiddenException);
      }
      expect(humorService.findOneHumorBoard).toHaveBeenCalledTimes(1);
      expect(humorBoardRepository.delete).toHaveBeenCalledTimes(0);
    });
    it('must be failed by InternalServerErrorException', async () => {
      expect.assertions(3);
      jest
        .spyOn(humorService, 'findOneHumorBoard')
        .mockResolvedValue(mockBoard);
      jest
        .spyOn(humorBoardRepository, 'softDelete')
        .mockResolvedValue(failedDeletedResult);

      try {
        await humorService.deleteHumorBoard(mockBoard.id, mockedUser);
      } catch (err) {
        expect(err).toBeInstanceOf(InternalServerErrorException);
      }
      expect(humorService.findOneHumorBoard).toHaveBeenCalledTimes(1);
      expect(humorBoardRepository.softDelete).toHaveBeenCalledTimes(1);
    });
  });
  describe('checkPostId', () => {
    it('must be success', async () => {
      jest
        .spyOn(humorService, 'findOneHumorBoard')
        .mockResolvedValue(mockBoard);

      const board = await humorService.checkPostId(mockBoard.id, mockedUser);
      expect(humorService.findOneHumorBoard).toHaveBeenCalledTimes(1);
      expect(board).toEqual(mockBoard);
    });
  });
});
