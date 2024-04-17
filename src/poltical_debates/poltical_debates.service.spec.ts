import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, UpdateResult } from 'typeorm';
import { PolticalDebatesService } from './poltical_debates.service';
import { PolticalDebateBoards } from './entities/poltical_debate.entity';
import { Trials } from '../trials/entities/trial.entity';
import { HumorBoards } from '../humors/entities/humor-board.entity';
import { HumorComments } from '../humor-comments/entities/humor_comment.entity';
import { PolticalDebateComments } from './entities/poltical_debate_comments.entity';
import { Role } from '../users/types/userRole.type';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdatePolticalDebateDto } from './dto/update-poltical_debate.dto';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';
import { S3Service } from '../s3/s3.service';

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

const incrViewmockPolticalDebate = {
  id: 1,
  userId: 1,
  title: 'test',
  content: 'test2',
  view: 2,
  createdAt: new Date(),
  updated_at: new Date(),
} as PolticalDebateBoards;

describe('PolticalDebatesService', () => {
  let polticalDebatesService: PolticalDebatesService;
  let polticalDebatesRepository: Repository<PolticalDebateBoards>;
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
      const files: Express.Multer.File[] = [];

      jest
        .spyOn(polticalDebatesRepository, 'create')
        .mockReturnValue(mockPolticalDebate);

      jest
        .spyOn(polticalDebatesRepository, 'save')
        .mockResolvedValue(mockPolticalDebate);

      const createPolticalDebate = await polticalDebatesService.create(
        mockedUser,
        createPolticalDebateDto,
        files,
      );

      expect(polticalDebatesRepository.save).toHaveBeenCalledTimes(1);
      expect(createPolticalDebate).toEqual(mockPolticalDebate);
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
        updated_at: new Date(),
      } as PolticalDebateBoards;

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
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('정치 토론 게시판 삭제 성공', async () => {
      const mockPolticalDebateId = 1;
      const mockUserId = 1;
      const result = {
        affected: 1,
      };

      const mockPolticalDebate = {
        id: mockPolticalDebateId,
        userId: mockUserId,
        title: '기존 타이틀',
        content: '기존 컨텐츠',
        view: 1,
        createdAt: new Date(),
        updated_at: new Date(),
      } as PolticalDebateBoards;
      const updatedResult = {
        affected: 1,
      } as UpdateResult;
      jest
        .spyOn(polticalDebatesRepository, 'findOne')
        .mockResolvedValue(mockPolticalDebate);
      jest
        .spyOn(polticalDebatesRepository, 'softDelete')
        .mockResolvedValue(updatedResult);

      const deleteBoard = await polticalDebatesService.delete(
        mockedUser,
        mockPolticalDebateId,
      );

      expect(polticalDebatesRepository.softDelete).toHaveBeenCalledWith(
        mockPolticalDebate.id,
      );
      expect(deleteBoard).toEqual(result);
    });

    it('정치 토론 게시판을 찾을 수 없습니다.', async () => {
      const mockPolticalDebateId = 1000;

      jest.spyOn(polticalDebatesRepository, 'findOne').mockResolvedValue(null);

      await expect(
        polticalDebatesService.delete(mockedUser, mockPolticalDebateId),
      ).rejects.toThrow(NotFoundException);
    });

    it('게시판를 삭제할 권한이 없습니다.', async () => {
      const mockPolticalDebate = {
        id: 1,
        userId: 2,
        title: '테스트',
        content: '테스트',
        view: 1,
        createdAt: new Date(),
        updated_at: new Date(),
      } as PolticalDebateBoards;
      jest
        .spyOn(polticalDebatesRepository, 'findOne')
        .mockResolvedValue(mockPolticalDebate);
      await expect(
        polticalDebatesService.delete(mockedUser, mockPolticalDebate.id),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
