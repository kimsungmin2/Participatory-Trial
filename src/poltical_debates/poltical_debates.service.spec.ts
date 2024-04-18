import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, UpdateResult } from 'typeorm';
import { PolticalDebatesService } from './poltical_debates.service';
import { PolticalDebateBoards } from './entities/poltical_debate.entity';

import {
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
import Redis from 'ioredis';

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
  let polticalDebatesVote: PolticalDebateVotes;
  let s3Service: S3Service;
  let dataSource: DataSource;
  let redis: Redis;
  const polticalDebatesRepositoryToken =
    getRepositoryToken(PolticalDebateBoards);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolticalDebatesService,
        DataSource,
        {
          provide: polticalDebatesRepositoryToken,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            softDelete: jest.fn(),
            count: jest.fn(),
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
      ],
    }).compile();

    polticalDebatesService = module.get<PolticalDebatesService>(
      PolticalDebatesService,
    );
    polticalDebatesRepository = module.get<Repository<PolticalDebateBoards>>(
      polticalDebatesRepositoryToken,
    );

    dataSource = module.get<DataSource>(DataSource);
  });

  it('polticalDebatesService should be defined', () => {
    expect(polticalDebatesService).toBeDefined();
  });

  it('polticalDebatesRepository should be defined', () => {
    expect(polticalDebatesService).toBeDefined();
  });

  // describe('정치 토론 게시판 생성', () => {
  //   it('성공', async () => {
  //     const createPolticalDebateDto: CreatePolticalDebateDto = {
  //       title: 'test',
  //       content: 'testtest',
  //     };
  //     const files: Express.Multer.File[] = [
  //       {
  //         fieldname: 'file',
  //         originalname: 'testfile.txt',
  //         encoding: '7bit',
  //         mimetype: 'text/plain',
  //         size: 128,
  //         destination: './upload',
  //         filename: 'testfile.txt',
  //         path: './upload/testfile.txt',
  //         buffer: Buffer.from('Hello World'),
  //         stream: Readable.from(Buffer.from('Hello World')),
  //       },
  //     ];

  //     jest
  //       .spyOn(s3Service, 'saveImages')
  //       .mockResolvedValue([{ imageUrl: 'https://example.com/image.jpg' }]);

  //     jest
  //       .spyOn(polticalDebatesRepository, 'create')
  //       .mockReturnValue(mockPolticalDebate);

  //     jest
  //       .spyOn(polticalDebatesRepository, 'save')
  //       .mockResolvedValue(mockPolticalDebate);

  //     const createPolticalDebate = await polticalDebatesService.create(
  //       mockedUser,
  //       createPolticalDebateDto,
  //       files,
  //     );

  //     expect(polticalDebatesRepository.save).toHaveBeenCalledTimes(1);
  //     expect(createPolticalDebate).toEqual(mockPolticalDebate);
  //   });

  //   it('실패: 예기치 못한 오류 발생 시', async () => {
  //     const createPolticalDebateDto: CreatePolticalDebateDto = {
  //       title: 'test',
  //       content: 'testtest',
  //     };
  //     const files: Express.Multer.File[] = [
  //       {
  //         fieldname: 'file',
  //         originalname: 'testfile.txt',
  //         encoding: '7bit',
  //         mimetype: 'text/plain',
  //         size: 128,
  //         destination: './upload',
  //         filename: 'testfile.txt',
  //         path: './upload/testfile.txt',
  //         buffer: Buffer.from('Hello World'),
  //         stream: Readable.from(Buffer.from('Hello World')),
  //       },
  //     ];

  //     // Mocking s3Service saveImages method
  //     jest
  //       .spyOn(s3Service, 'saveImages')
  //       .mockResolvedValue([{ imageUrl: 'https://example.com/image.jpg' }]);

  //     // Mocking polticalDebatesRepository save method to throw an error
  //     jest
  //       .spyOn(polticalDebatesRepository, 'save')
  //       .mockRejectedValue(new Error('Database error'));

  //     // Expecting the service method to throw an InternalServerErrorException
  //     await expect(
  //       polticalDebatesService.create(
  //         mockedUser,
  //         createPolticalDebateDto,
  //         files,
  //       ),
  //     ).rejects.toThrow(InternalServerErrorException);
  //   });
  // });

  describe('createBothBoardandVote', () => {
    let polticalDebatesService: PolticalDebatesService;

    it('should create a political bulletin board post and a vote simultaneously', async () => {
      // Mock input data
      const userId = 1;
      const createPolticalDebateDto: CreatePolticalDebateDto = {
        title: 'Test Debate',
        content: 'This is a test political debate.',
      };
      const voteTitleDto: VoteTitleDto = {
        title1: 'Option A',
        title2: 'Option B',
      };

      // Mock expected data
      const polticalId = 1;

      // Mock the behavior of the data source
      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          create: jest
            .fn()
            .mockReturnValueOnce(polticalDebatesRepository) // Return the new board
            .mockReturnValueOnce(polticalDebatesVote), // Return the new vote
          save: jest.fn(), // Not needed for this test
        },
      };

      // Mock the behavior of the data source method
      jest
        .spyOn(dataSource, 'createQueryRunner')
        .mockReturnValue(mockQueryRunner as any);

      // Call the method under test
      const result = await polticalDebatesService.createBothBoardandVote(
        userId,
        createPolticalDebateDto,
        voteTitleDto,
      );

      expect(polticalDebatesRepository.save).toHaveBeenCalledTimes(1);
      expect(createPolticalDebateDto).toEqual(mockPolticalDebate);
    });
  });

  describe('정치 토론 게시판 전체 조회', () => {
    const mockPolticalDebateBoards = [
      {
        mockPolticalDebate,
      },
    ] as unknown as PolticalDebateBoards[];
    it('성공', async () => {
      const mockPolticalDebates = {
        polticalDebateBoards: mockPolticalDebateBoards,
        totalItems: 3,
      };
      const PaginationQueryDto = {
        limit: 1,
        page: 1,
      };
      jest
        .spyOn(polticalDebatesRepository, 'find')
        .mockResolvedValue(mockPolticalDebateBoards);

      jest.spyOn(polticalDebatesRepository, 'count').mockResolvedValue(3);

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

  describe('정치 토론 게시판 상세 조회', () => {
    const a = {
      id: 1,
      userId: 1,
      title: 'test',
      content: 'test2',
      view: 1,
      createdAt: new Date(),
      updated_at: new Date(),
    } as PolticalDebateBoards;

    const b = {
      ...a,
      view: a.view + 1,
    };
    it('성공', async () => {
      const mockPolticalDebateId = 1;
      jest.spyOn(polticalDebatesRepository, 'findOne').mockResolvedValue(a);

      const findOnePolticalDebateBoard =
        await polticalDebatesService.findOne(mockPolticalDebateId);

      expect(findOnePolticalDebateBoard).toEqual(b);
    });

    it('실패: 정치 토론 게시판을 찾을 수 없습니다.', async () => {
      const mockPolticalDebateId = 1000;
      jest.spyOn(polticalDebatesRepository, 'findOne').mockResolvedValue(null);

      await expect(
        polticalDebatesService.findOne(mockPolticalDebateId),
      ).rejects.toThrow(NotFoundException);
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
        updated_at: new Date(),
      } as PolticalDebateBoards;

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
      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          create: jest
            .fn()
            .mockReturnValueOnce(polticalDebatesRepository) // Return the new board
            .mockReturnValueOnce(polticalDebatesVote), // Return the new vote
          save: jest.fn(), // Not needed for this test
        },
      };
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        PolticalDebateVotes,
        expect.objectContaining({
          title1: VoteTitleDto.title1,
          title2: VoteTitleDto.title2,
          mockPolticalDebateId,
        }),
      );
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });
  });
  //   describe('정치 토론 게시판 전체 조회', () => {
  //     const mockPolticalDebateBoards = [
  //       {
  //         mockPolticalDebate,
  //       },
  //     ] as unknown as PolticalDebateBoards[];
  //     it('성공', async () => {
  //       const mockPolticalDebates = {
  //         polticalDebateBoards: mockPolticalDebateBoards,
  //         totalItems: 3,
  //       };
  //       const PaginationQueryDto = {
  //         limit: 1,
  //         page: 1,
  //       };
  //       jest
  //         .spyOn(polticalDebatesRepository, 'find')
  //         .mockResolvedValue(mockPolticalDebateBoards);

  //       jest.spyOn(polticalDebatesRepository, 'count').mockResolvedValue(3);

  //       const findAllPolticalDebateBoard =
  //         await polticalDebatesService.findAll();

  //       expect(findAllPolticalDebateBoard).toEqual(mockPolticalDebates);
  //     });
  //   });

  //   describe('유저의 정치 토론 게시판 조회 ', () => {
  //     it('성공', async () => {
  //       const mockUserId = 1;
  //       const mockUserPolticalDebates: PolticalDebateBoards[] = [
  //         mockPolticalDebate,
  //       ];
  //       jest
  //         .spyOn(polticalDebatesRepository, 'find')
  //         .mockResolvedValue(mockUserPolticalDebates);

  //       const findOnePolticalDebateBoard =
  //         await polticalDebatesService.findMyBoards(mockUserId);

  //       expect(findOnePolticalDebateBoard).toEqual(mockUserPolticalDebates);
  //     });
  //   });

  //   describe('정치 토론 게시판 상세 조회', () => {
  //     const originalViewCount = 1;
  //     const cachedViewCount = 2; // Assuming Redis returns a cached count of 2
  //     const totalViewCount = originalViewCount + cachedViewCount;

  //     const a = {
  //       id: 1,
  //       userId: 1,
  //       title: 'test',
  //       content: 'test2',
  //       view: 1,
  //       createdAt: new Date(),
  //       updated_at: new Date(),
  //     } as PolticalDebateBoards;

  //     const b = {
  //       ...a,
  //       view: totalViewCount,
  //     };
  //     it('성공', async () => {
  //       const mockPolticalDebateId = 1;
  //       jest.spyOn(polticalDebatesRepository, 'findOne').mockResolvedValue(a);
  //       jest.spyOn(redis, 'incr').mockResolvedValue(cachedViewCount);

  //       const findOnePolticalDebateBoard =
  //         await polticalDebatesService.findOne(mockPolticalDebateId);

  //       expect(findOnePolticalDebateBoard).toEqual(b);
  //     });

  //     it('실패: 정치 토론 게시판을 찾을 수 없습니다.', async () => {
  //       const mockPolticalDebateId = 1000;
  //       jest
  //         .spyOn(polticalDebatesRepository, 'findOne')
  //         .mockResolvedValue(null);

  //       await expect(
  //         polticalDebatesService.findOne(mockPolticalDebateId),
  //       ).rejects.toThrow(NotFoundException);
  //     });
  //   });

  //   describe('정치 토론 게시판 수정', () => {
  //     beforeEach(() => {
  //       jest.clearAllMocks();
  //     });

  //     it('정치 토론 게시판 업데이트 성공', async () => {
  //       const updatePolticalDebateDto: UpdatePolticalDebateDto = {
  //         title: 'Updated Title',
  //         content: 'Updated Content',
  //       };

  //       const mockPolticalDebateId = 1;
  //       const mockUserId = 1;

  //       const mockPolticalDebate = {
  //         id: mockPolticalDebateId,
  //         userId: mockUserId,
  //         title: '기존 타이틀',
  //         content: '기존 컨텐츠',
  //         view: 1,
  //         createdAt: new Date(),
  //         updated_at: new Date(),
  //       } as PolticalDebateBoards;

  //       jest
  //         .spyOn(polticalDebatesRepository, 'findOne')
  //         .mockResolvedValue(mockPolticalDebate);
  //       jest
  //         .spyOn(polticalDebatesRepository, 'save')
  //         .mockResolvedValue(mockPolticalDebate);

  //       const updatedBoard = await polticalDebatesService.update(
  //         mockedUser,
  //         mockPolticalDebateId,
  //         updatePolticalDebateDto,
  //       );

  //       expect(polticalDebatesRepository.save).toHaveBeenCalledWith(
  //         mockPolticalDebate,
  //       );

  //       expect(updatedBoard).toEqual(mockPolticalDebate);
  //     });
  //     it('실패: 정치 토론 게시판을 찾을 수 없습니다.', async () => {
  //       const updatePolticalDebateDto: UpdatePolticalDebateDto = {
  //         title: 'Updated Title',
  //         content: 'Updated Content',
  //       };

  //       const mockPolticalDebateId = 1000;

  //       jest
  //         .spyOn(polticalDebatesRepository, 'findOne')
  //         .mockResolvedValue(null);

  //       await expect(
  //         polticalDebatesService.update(
  //           mockedUser,
  //           mockPolticalDebateId,
  //           updatePolticalDebateDto,
  //         ),
  //       ).rejects.toThrow(NotFoundException);
  //     });
  //     it('실패: 게시판을 수정할 권한이 없습니다.', async () => {
  //       const updatePolticalDebateDto: UpdatePolticalDebateDto = {
  //         title: 'Updated Title',
  //         content: 'Updated Content',
  //       };

  //       const mockPolticalDebate = {
  //         id: 1,
  //         userId: 2,
  //         title: '테스트',
  //         content: '테스트',
  //         view: 1,
  //         createdAt: new Date(),
  //         updated_at: new Date(),
  //       } as PolticalDebateBoards;

  //       jest
  //         .spyOn(polticalDebatesRepository, 'findOne')
  //         .mockResolvedValue(mockPolticalDebate);

  //       await expect(
  //         polticalDebatesService.update(
  //           mockedUser,
  //           mockPolticalDebate.id,
  //           updatePolticalDebateDto,
  //         ),
  //       ).rejects.toThrow(UnauthorizedException);
  //     });
  //   });
  //   describe('정치 토론 게시판 삭제', () => {
  //     beforeEach(() => {
  //       jest.clearAllMocks();
  //     });
  //     it('정치 토론 게시판 삭제 성공', async () => {
  //       const mockPolticalDebateId = 1;
  //       const mockUserId = 1;
  //       const result = {
  //         affected: 1,
  //       };

  //       const mockPolticalDebate = {
  //         id: mockPolticalDebateId,
  //         userId: mockUserId,
  //         title: '기존 타이틀',
  //         content: '기존 컨텐츠',
  //         view: 1,
  //         createdAt: new Date(),
  //         updated_at: new Date(),
  //       } as PolticalDebateBoards;
  //       const updatedResult = {
  //         affected: 1,
  //       } as UpdateResult;
  //       jest
  //         .spyOn(polticalDebatesRepository, 'findOne')
  //         .mockResolvedValue(mockPolticalDebate);
  //       jest
  //         .spyOn(polticalDebatesRepository, 'softDelete')
  //         .mockResolvedValue(updatedResult);

  //       const deleteBoard = await polticalDebatesService.delete(
  //         mockedUser,
  //         mockPolticalDebateId,
  //       );

  //       expect(polticalDebatesRepository.softDelete).toHaveBeenCalledWith(
  //         mockPolticalDebate.id,
  //       );
  //       expect(deleteBoard).toEqual(result);
  //     });

  //     it('정치 토론 게시판을 찾을 수 없습니다.', async () => {
  //       const mockPolticalDebateId = 1000;

  //       jest
  //         .spyOn(polticalDebatesRepository, 'findOne')
  //         .mockResolvedValue(null);

  //       await expect(
  //         polticalDebatesService.delete(mockedUser, mockPolticalDebateId),
  //       ).rejects.toThrow(NotFoundException);
  //     });

  //     it('게시판를 삭제할 권한이 없습니다.', async () => {
  //       const mockPolticalDebate = {
  //         id: 1,
  //         userId: 2,
  //         title: '테스트',
  //         content: '테스트',
  //         view: 1,
  //         createdAt: new Date(),
  //         updated_at: new Date(),
  //       } as PolticalDebateBoards;
  //       jest
  //         .spyOn(polticalDebatesRepository, 'findOne')
  //         .mockResolvedValue(mockPolticalDebate);
  //       await expect(
  //         polticalDebatesService.delete(mockedUser, mockPolticalDebate.id),
  //       ).rejects.toThrow(UnauthorizedException);
  //     });
  //   });
  // });
});
