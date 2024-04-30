import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository, UpdateResult } from 'typeorm';
import { PolticalDebatesService } from './poltical_debates.service';
import { PolticalDebateBoards } from './entities/poltical_debate.entity';

import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdatePolticalDebateDto } from './dto/update-poltical_debate.dto';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';
import { S3Service } from '../s3/s3.service';
import { Readable } from 'stream';
import { VoteTitleDto } from '../trials/vote/dto/voteDto';
import { PolticalDebateVotes } from './entities/polticalVote.entity';
import { PaginationQueryDto } from '../humors/dto/get-humorBoard.dto';
import { Users } from '../users/entities/user.entity';
import { UserInfos } from '../users/entities/user-info.entity';
import { UpdateVoteDto } from '../trials/vote/dto/updateDto';
import { RedisService } from '../cache/redis.service';
import { BoardType } from '../s3/board-type';
import Redis from 'ioredis';
import { UsersService } from '../users/users.service';

const mockedUser = {
  id: 1,
  email: 'example@naver.com',
  password: '1',
  nickName: 'test',
  birth: '1992-02-22',
  provider: 'test',
  verifiCationCode: 1,
  emailVerified: true,
  createdAt: new Date('2024-03-24T02:05:02.602Z'),
  updatedAt: new Date('2024-03-24T02:05:02.602Z'),
  user: null,
};

const mockPolticalDebate = {
  id: 1,
  userId: 1,
  title: 'test',
  content: 'test2',
  view: 1,
  createdAt: new Date(),
  updated_at: new Date(),
} as PolticalDebateBoards;

describe('PolticalDebatesService', () => {
  let polticalDebatesService: PolticalDebatesService;
  let polticalDebatesRepository: Repository<PolticalDebateBoards>;
  let polticalDebatesVoteRepository: Repository<PolticalDebateVotes>;
  let s3Service: S3Service;
  let dataSource: DataSource;
  let redisService: RedisService;
  let usersService: UsersService;
  const polticalDebatesRepositoryToken =
    getRepositoryToken(PolticalDebateBoards);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolticalDebatesService,
        DataSource,
        UsersService,
        {
          provide: polticalDebatesRepositoryToken,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            softDelete: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PolticalDebateBoards),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            softDelete: jest.fn(),
            count: jest.fn().mockResolvedValue(20),
          },
        },
        {
          provide: getRepositoryToken(PolticalDebateVotes),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(() => ({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: {
                create: jest.fn(),
                save: jest.fn(),
                findOne: jest.fn(),
                delete: jest.fn(),
                update: jest.fn(),
              },
            })),
          },
        },
        {
          provide: S3Service,
          useValue: {
            saveImages: jest
              .fn()
              .mockResolvedValue([
                { imageUrl: 'https://example.com/image.jpg' },
              ]),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getCluster: jest.fn().mockReturnValue({
              incr: jest.fn(),
              disconnect: jest.fn(),
            }),
            onModuleDestroy: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByMyId: jest.fn(),
            findById: jest.fn().mockResolvedValue({ nickName: 'User1' }),
            userUpdate: jest.fn(),
            userDelete: jest.fn(),
            updateClientsInfo: jest.fn(),
          },
        },
      ],
    }).compile();

    polticalDebatesService = module.get<PolticalDebatesService>(
      PolticalDebatesService,
    );
    polticalDebatesRepository = module.get<Repository<PolticalDebateBoards>>(
      polticalDebatesRepositoryToken,
    );
    polticalDebatesVoteRepository = module.get<Repository<PolticalDebateVotes>>(
      getRepositoryToken(PolticalDebateVotes),
    );

    usersService = module.get<UsersService>(UsersService);

    s3Service = module.get<S3Service>(S3Service);

    dataSource = module.get<DataSource>(DataSource);

    redisService = module.get<RedisService>(RedisService);
  });

  it('polticalDebatesService should be defined', () => {
    expect(polticalDebatesService).toBeDefined();
  });

  it('polticalDebatesRepository should be defined', () => {
    expect(polticalDebatesService).toBeDefined();
  });

  describe('정치 토론 게시판 생성', () => {
    it('성공', async () => {
      const createPolticalDebateDto: CreatePolticalDebateDto = {
        title: 'test',
        content: 'testtest',
      };
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

      jest
        .spyOn(s3Service, 'saveImages')
        .mockResolvedValue([{ imageUrl: 'https://example.com/image.jpg' }]);

      jest
        .spyOn(polticalDebatesRepository, 'save')
        .mockResolvedValue(mockPolticalDebate);

      const createPolticalDebate = await polticalDebatesService.create(
        mockedUser,
        createPolticalDebateDto,
        files,
      );

      expect(s3Service.saveImages).toHaveBeenCalledTimes(1);
      expect(s3Service.saveImages).toHaveBeenCalledWith(
        files,
        BoardType.PolticalDebate,
      );
      expect(polticalDebatesRepository.save).toHaveBeenCalledTimes(1);
      expect(polticalDebatesRepository.save).toHaveBeenCalledWith({
        userId: mockedUser.id,
        ...createPolticalDebateDto,
        imageUrl: JSON.stringify(['https://example.com/image.jpg']),
      });
      expect(createPolticalDebate).toEqual(mockPolticalDebate);
    });

    it('실패: 예기치 못한 오류 발생 시', async () => {
      const createPolticalDebateDto: CreatePolticalDebateDto = {
        title: 'test',
        content: 'testtest',
      };
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

      jest
        .spyOn(s3Service, 'saveImages')
        .mockResolvedValue([{ imageUrl: 'https://example.com/image.jpg' }]);

      jest
        .spyOn(polticalDebatesRepository, 'save')
        .mockRejectedValueOnce(new Error('Database error'));

      await expect(
        polticalDebatesService.create(
          mockedUser,
          createPolticalDebateDto,
          files,
        ),
      ).rejects.toThrow(InternalServerErrorException);
      expect(polticalDebatesRepository.save).toHaveBeenCalledTimes(1);
      expect(polticalDebatesRepository.save).toHaveBeenCalledWith({
        userId: mockedUser.id,
        ...createPolticalDebateDto,
        imageUrl: JSON.stringify(['https://example.com/image.jpg']),
      });
    });
  });

  describe('createBothBoardandVote', () => {
    let polticalDebatesService: PolticalDebatesService;
    let mockQueryRunner: any;

    beforeEach(() => {
      jest.clearAllMocks();

      mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          create: jest.fn(),
          save: jest.fn(),
        },
      };

      const mockDataSource = {
        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      };
      const mockRepository = {} as Repository<PolticalDebateBoards>;
      const mockVoteRepository = {} as Repository<PolticalDebateVotes>;
      const mockS3Service = {} as S3Service;
      const mockRedis = {} as RedisService;
      const mockUsers = {} as UsersService;

      polticalDebatesService = new PolticalDebatesService(
        mockRepository,
        mockVoteRepository,
        mockDataSource as any,
        mockS3Service,
        mockRedis,
        mockUsers,
      );
    });

    it('성공', async () => {
      const createPolticalDebateDto: CreatePolticalDebateDto = {
        title: 'Test Title',
        content: 'Test Content',
      };
      const voteTitleDto: VoteTitleDto = {
        title1: 'Vote Title 1',
        title2: 'Vote Title 2',
      };

      const mockUserId = 1;

      const mockPolticalDebate = {
        id: 1,
        userId: 1,
        title: 'Test Title',
        content: 'Test Content',
        createdAt: new Date(),
        updated_at: new Date(),
      } as PolticalDebateBoards;

      const mockPolticalDebateVote = {
        id: 1,
        title1: 'Vote Title 1',
        title2: 'Vote Title 2',
        polticalId: 1,
      } as PolticalDebateVotes;

      mockQueryRunner.manager.create
        .mockReturnValueOnce(mockPolticalDebate)
        .mockReturnValueOnce(mockPolticalDebateVote);
      mockQueryRunner.manager.save
        .mockResolvedValueOnce(mockPolticalDebate)
        .mockResolvedValueOnce(mockPolticalDebateVote);

      const result = await polticalDebatesService.createBothBoardandVote(
        mockUserId,
        createPolticalDebateDto,
        voteTitleDto,
      );

      expect(mockQueryRunner.connect).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.manager.create).toHaveBeenNthCalledWith(
        1,
        PolticalDebateBoards,
        {
          title: 'Test Title',
          content: 'Test Content',
          userId: 1,
        },
      );
      expect(mockQueryRunner.manager.create).toHaveBeenNthCalledWith(
        2,
        PolticalDebateVotes,
        {
          title1: 'Vote Title 1',
          title2: 'Vote Title 2',
          polticalId: 1,
        },
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(2);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        newVote: mockPolticalDebateVote,
        savedVote: mockPolticalDebateVote,
      });
    });

    it('실패', async () => {
      const createPolticalDebateDto: CreatePolticalDebateDto = {
        title: 'Test Title',
        content: 'Test Content',
      };
      const voteTitleDto: VoteTitleDto = {
        title1: 'Vote Title 1',
        title2: 'Vote Title 2',
      };

      const mockUserId = 1;

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          create: jest.fn(),
          save: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      };

      const mockDataSource = {
        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      };
      const mockRepository = {} as Repository<PolticalDebateBoards>;
      const mockVoteRepository = {} as Repository<PolticalDebateVotes>;
      const mockS3Service = {} as S3Service;
      const mockRedis = {} as RedisService;
      const mockUsers = {} as UsersService;

      const polticalDebatesService = new PolticalDebatesService(
        mockRepository,
        mockVoteRepository,
        mockDataSource as any,
        mockS3Service,
        mockRedis,
        mockUsers,
      );

      await expect(
        polticalDebatesService.createBothBoardandVote(
          mockUserId,
          createPolticalDebateDto,
          voteTitleDto,
        ),
      ).rejects.toThrow(InternalServerErrorException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAllWithPaginateBoard', () => {
    it('성공', async () => {
      const paginationQueryDto: PaginationQueryDto = {
        page: 1,
        limit: 10,
      };
      const mockPolticalDebateBoards: PolticalDebateBoards[] = [
        {
          id: 1,
          userId: 1,
          title: 'Test Debate 1',
          content: 'Test content 1',
          view: 10,
          createdAt: new Date(),
          updated_at: new Date(),
          deleted_at: null,
          user: null,
          polticalDebateComments: [],
          polticalDebateVotes: null,
        },
        {
          id: 2,
          userId: 2,
          title: 'Test Debate 2',
          content: 'Test content 2',
          view: 15,
          createdAt: new Date(),
          updated_at: new Date(),
          deleted_at: null,
          user: null,
          polticalDebateComments: [],
          polticalDebateVotes: null,
        },
      ];

      jest
        .spyOn(polticalDebatesRepository, 'find')
        .mockResolvedValueOnce(mockPolticalDebateBoards);

      const expectedResult = {
        polticalDebateBoards: mockPolticalDebateBoards.map((board) => ({
          ...board,
          userName: 'User1',
        })),
        totalItems: 20,
      };

      const result =
        await polticalDebatesService.findAllWithPaginateBoard(
          paginationQueryDto,
        );
      expect(result).toEqual(expectedResult);
    });

    it('실패', async () => {
      const paginationQueryDto: PaginationQueryDto = {
        page: 1,
        limit: 10,
      };

      jest
        .spyOn(polticalDebatesRepository, 'count')
        .mockImplementationOnce(() => {
          throw new InternalServerErrorException('Error loading posts');
        });

      await expect(
        polticalDebatesService.findAllWithPaginateBoard(paginationQueryDto),
      ).rejects.toThrow(InternalServerErrorException);

      expect(polticalDebatesRepository.count).toHaveBeenCalledTimes(1);
    });
  });

  describe('정치 토론 게시판 전체 조회', () => {
    it('성공', async () => {
      const mockPolticalDebates: PolticalDebateBoards[] = [mockPolticalDebate];
      jest
        .spyOn(polticalDebatesRepository, 'find')
        .mockResolvedValue(mockPolticalDebates);

      const findAllPolticalDebateBoard = await polticalDebatesService.findAll();

      expect(findAllPolticalDebateBoard).toEqual(mockPolticalDebates);
    });
  });

  describe('유저의 정치 토론 게시판 조회 ', () => {
    it('성공', async () => {
      const mockUserId = 1;
      const mockUserPolticalDebates: PolticalDebateBoards[] = [
        mockPolticalDebate,
      ];
      jest
        .spyOn(polticalDebatesRepository, 'find')
        .mockResolvedValue(mockUserPolticalDebates);

      const findOnePolticalDebateBoard =
        await polticalDebatesService.findMyBoards(mockUserId);

      expect(findOnePolticalDebateBoard).toEqual(mockUserPolticalDebates);
    });
  });

  describe('findOne', () => {
    it('성공', async () => {
      const mockBoard = {
        id: 1,
        userId: 1,
        title: 'Test Debate',
        content: 'Test content',
        view: 10,
        createdAt: new Date(),
        updated_at: new Date(),
        polticalDebateComments: [],
        polticalDebateVotes: [],
      };
      (polticalDebatesRepository.findOne as jest.Mock).mockResolvedValueOnce(
        mockBoard,
      );

      const mockCachedView = 15;
      (redisService.getCluster().incr as jest.Mock).mockResolvedValue(
        mockCachedView,
      );

      const result = await polticalDebatesService.findOne(1);

      expect(polticalDebatesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['polticalDebateComments', 'polticalDebateVotes'],
      });

      expect(result).toEqual({
        ...mockBoard,
        view: mockBoard.view + mockCachedView,
      });
    });

    it('게시물을 찾을 수 없습니다.', async () => {
      (polticalDebatesRepository.findOne as jest.Mock).mockResolvedValueOnce(
        null,
      );

      await expect(polticalDebatesService.findOne(1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('요청을 처리하는 도중 오류가 발생했습니다.', async () => {
      const mockBoard = {
        id: 1,
        userId: 1,
        title: 'Test Debate',
        content: 'Test content',
        view: 10,
        createdAt: new Date(),
        updated_at: new Date(),
        polticalDebateComments: [],
        polticalDebateVotes: [],
      };
      (polticalDebatesRepository.findOne as jest.Mock).mockResolvedValueOnce(
        mockBoard,
      );

      (redisService.getCluster().incr as jest.Mock).mockRejectedValueOnce(
        new Error('Redis error'),
      );

      await expect(polticalDebatesService.findOne(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('정치 토론 게시판 수정', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('정치 토론 게시판 업데이트 성공', async () => {
      const updatePolticalDebateDto: UpdatePolticalDebateDto = {
        title: 'Updated Title',
        content: 'Updated Content',
      };

      const mockPolticalDebateId = 1;
      const mockUserId = 1;

      const mockPolticalDebate = {
        id: mockPolticalDebateId,
        userId: mockUserId,
        title: '기존 타이틀',
        content: '기존 컨텐츠',
        view: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as PolticalDebateBoards;

      jest
        .spyOn(polticalDebatesRepository, 'findOne')
        .mockResolvedValue(mockPolticalDebate);
      jest
        .spyOn(polticalDebatesRepository, 'save')
        .mockResolvedValue(mockPolticalDebate);

      const updatedBoard = await polticalDebatesService.update(
        mockedUser,
        mockPolticalDebateId,
        updatePolticalDebateDto,
      );

      expect(polticalDebatesRepository.save).toHaveBeenCalledWith(
        mockPolticalDebate,
      );

      expect(updatedBoard).toEqual(mockPolticalDebate);
    });
    it('실패: 정치 토론 게시판을 찾을 수 없습니다.', async () => {
      const updatePolticalDebateDto: UpdatePolticalDebateDto = {
        title: 'Updated Title',
        content: 'Updated Content',
      };

      const mockPolticalDebateId = 1000;

      jest.spyOn(polticalDebatesRepository, 'findOne').mockResolvedValue(null);

      await expect(
        polticalDebatesService.update(
          mockedUser,
          mockPolticalDebateId,
          updatePolticalDebateDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });
    it('실패: 게시판을 수정할 권한이 없습니다.', async () => {
      const updatePolticalDebateDto: UpdatePolticalDebateDto = {
        title: 'Updated Title',
        content: 'Updated Content',
      };

      const mockPolticalDebate = {
        id: 1,
        userId: 2,
        title: '테스트',
        content: '테스트',
        view: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as PolticalDebateBoards;

      jest
        .spyOn(polticalDebatesRepository, 'findOne')
        .mockResolvedValue(mockPolticalDebate);

      await expect(
        polticalDebatesService.update(
          mockedUser,
          mockPolticalDebate.id,
          updatePolticalDebateDto,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('정치 토론 게시판 삭제', () => {
    it('성공', async () => {
      const mockUpdateResult: UpdateResult = {
        raw: {},
        affected: 1,
        generatedMaps: [],
      };

      const politicalDebateBoard = {
        id: 1,
        userId: 1,
      } as PolticalDebateBoards;

      const userInfo: UserInfos = {
        id: politicalDebateBoard.userId,
        email: 'example@example.com',
        password: 'password123',
        nickName: 'user123',
        birth: '1990-01-01',
        provider: '',
        emailVerified: false,
        createdAt: undefined,
        updatedAt: undefined,
        user: new Users(),
      };

      jest
        .spyOn(polticalDebatesRepository, 'findOne')
        .mockResolvedValue(politicalDebateBoard);

      jest
        .spyOn(polticalDebatesRepository, 'softDelete')
        .mockResolvedValue(mockUpdateResult);

      const result = await polticalDebatesService.delete(
        userInfo,
        politicalDebateBoard.id,
      );

      expect(polticalDebatesRepository.findOne).toHaveBeenCalledWith({
        where: { id: politicalDebateBoard.id },
      });

      expect(polticalDebatesRepository.softDelete).toHaveBeenCalledWith(
        politicalDebateBoard.id,
      );

      expect(result).toMatchObject({
        affected: 1,
        generatedMaps: [],
        raw: {},
      });
    });

    it('실패: 정치 토론 게시판을 찾을 수 없습니다.', async () => {
      const userInfo = {
        id: 1,
        email: 'test@example.com',
        password: 'password',
        nickName: 'testUser',
        birth: '1990-01-01',
      };
      const id = 1;

      jest.spyOn(polticalDebatesRepository, 'findOne').mockResolvedValue(null);

      await expect(
        polticalDebatesService.delete(userInfo as UserInfos, id),
      ).rejects.toThrow(NotFoundException);
    });

    it('실패: 게시판을 수정할 권한이 없습니다.', async () => {
      const userInfo = {
        id: 1,
        email: 'test@example.com',
        password: 'password',
        nickName: 'testUser',
        birth: '1990-01-01',
      };
      const id = 1;

      const politicalDebateBoard: PolticalDebateBoards = {
        id: 1,
        userId: 2,
        title: 'Test Title',
        content: 'Test Content',
        view: 0,
        createdAt: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        user: new Users(),
        polticalDebateComments: [],
        polticalDebateVotes: new PolticalDebateVotes(),
      };
      jest
        .spyOn(polticalDebatesRepository, 'findOne')
        .mockResolvedValue(politicalDebateBoard);

      await expect(
        polticalDebatesService.delete(userInfo as UserInfos, id),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('정치 게시만 투표 vs 만들기 매서드', () => {
    it('성공', async () => {
      const polticalId = 1;
      const voteDto: VoteTitleDto = {
        title1: 'Title 1',
        title2: 'Title 2',
      };
      const expectedVote = {
        title1: 'Title 1',
        title2: 'Title 2',
        polticalId: 1,
      };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        manager: {
          create: jest.fn().mockReturnValue(expectedVote),
          save: jest.fn(),
        },
        release: jest.fn(),
      };

      const mockDataSource = {
        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      };

      const mockRepository = {} as Repository<PolticalDebateBoards>;
      const mockVoteRepository = {} as Repository<PolticalDebateVotes>;
      const mockS3Service = {} as S3Service;
      const mockRedis = {} as RedisService;
      const mockUsers = {} as UsersService;
      const polticalDebatesService = new PolticalDebatesService(
        mockRepository,
        mockVoteRepository,
        mockDataSource as any,
        mockS3Service,
        mockRedis,
        mockUsers,
      );

      const result = await polticalDebatesService.createSubject(
        polticalId,
        voteDto,
      );

      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        PolticalDebateVotes,
        expectedVote,
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        PolticalDebateVotes,
        expectedVote,
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(expectedVote);
    });

    it('실패: vs 생성 중 오류가 발생했습니다.', async () => {
      const polticalId = 1;
      const voteDto: VoteTitleDto = {
        title1: 'Title 1',
        title2: 'Title 2',
      };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        manager: {
          create: jest.fn(),
          save: jest.fn().mockRejectedValue(new Error()),
        },
        release: jest.fn(),
      };

      const mockDataSource = {
        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      };

      const mockRepository = {} as Repository<PolticalDebateBoards>;
      const mockVoteRepository = {} as Repository<PolticalDebateVotes>;
      const mockS3Service = {} as S3Service;
      const mockRedis = {} as RedisService;
      const mockUsers = {} as UsersService;
      const polticalDebatesService = new PolticalDebatesService(
        mockRepository,
        mockVoteRepository,
        mockDataSource as any,
        mockS3Service,
        mockRedis,
        mockUsers,
      );

      await expect(
        polticalDebatesService.createSubject(polticalId, voteDto),
      ).rejects.toThrow(InternalServerErrorException);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('정치 게시만 투표 vs 수정 매서드', () => {
    it('성공', async () => {
      const polticalVoteId = 1;
      const updateVoteDto: UpdateVoteDto = {
        title1: 'Updated Title 1',
        title2: 'Updated Title 2',
      };
      const updatedVote = {
        id: polticalVoteId,
        title1: 'Updated Title 1',
        title2: 'Updated Title 2',
        polticalId: 1,
      };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue(updatedVote),
          save: jest.fn().mockResolvedValue(updatedVote),
        },
        release: jest.fn(),
      };

      const mockDataSource = {
        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      };

      const mockRepository = {} as Repository<PolticalDebateBoards>;
      const mockVoteRepository = {} as Repository<PolticalDebateVotes>;
      const mockS3Service = {} as S3Service;
      const mockRedis = {} as RedisService;
      const mockUsers = {} as UsersService;
      const polticalDebatesService = new PolticalDebatesService(
        mockRepository,
        mockVoteRepository,
        mockDataSource as any,
        mockS3Service,
        mockRedis,
        mockUsers,
      );

      const result = await polticalDebatesService.updateSubject(
        polticalVoteId,
        updateVoteDto,
      );

      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(0);
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);

      expect(result).toEqual(updatedVote);
    });

    it('실패: vs 수정 중 오류가 발생했습니다.', async () => {
      const polticalVoteId = 1;
      const updateVoteDto: UpdateVoteDto = {
        title1: 'Updated Title 1',
        title2: 'Updated Title 2',
      };

      const error = new Error('Update error');

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn().mockRejectedValue(error),
        },
        release: jest.fn(),
      };

      const mockDataSource = {
        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      };

      const mockRepository = {} as Repository<PolticalDebateBoards>;
      const mockVoteRepository = {} as Repository<PolticalDebateVotes>;
      const mockS3Service = {} as S3Service;
      const mockRedis = {} as RedisService;
      const mockUsers = {} as UsersService;
      const polticalDebatesService = new PolticalDebatesService(
        mockRepository,
        mockVoteRepository,
        mockDataSource as any,
        mockS3Service,
        mockRedis,
        mockUsers,
      );

      await expect(
        polticalDebatesService.updateSubject(polticalVoteId, updateVoteDto),
      ).rejects.toThrow(InternalServerErrorException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('정치 게시만 투표 vs 삭제 매서드', () => {
    it('성공', async () => {
      const polticalVoteId = 1;
      const deleteResult = { affected: 1 };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          delete: jest.fn().mockResolvedValue(deleteResult),
        },
        commitTransaction: jest.fn(),
        release: jest.fn(),
      };

      const mockDataSource = {
        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      };

      const mockRepository = {} as Repository<PolticalDebateBoards>;
      const mockVoteRepository = {} as Repository<PolticalDebateVotes>;
      const mockS3Service = {} as S3Service;
      const mockRedis = {} as RedisService;
      const mockUsers = {} as UsersService;
      const polticalDebatesService = new PolticalDebatesService(
        mockRepository,
        mockVoteRepository,
        mockDataSource as any,
        mockS3Service,
        mockRedis,
        mockUsers,
      );

      await polticalDebatesService.deleteVote(polticalVoteId);

      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('실패: vs 삭제 중 오류가 발생했습니다.', async () => {
      const polticalVoteId = 1;

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          delete: jest.fn().mockRejectedValue(new Error('Delete failed')),
        },
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };

      const mockDataSource = {
        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      };

      const mockRepository = {} as Repository<PolticalDebateBoards>;
      const mockVoteRepository = {} as Repository<PolticalDebateVotes>;
      const mockS3Service = {} as S3Service;
      const mockRedis = {} as RedisService;
      const mockUsers = {} as UsersService;
      const polticalDebatesService = new PolticalDebatesService(
        mockRepository,
        mockVoteRepository,
        mockDataSource as any,
        mockS3Service,
        mockRedis,
        mockUsers,
      );

      await expect(
        polticalDebatesService.deleteVote(polticalVoteId),
      ).rejects.toThrow(InternalServerErrorException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });
  });
});
