import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { PolticalDebatesService } from './poltical_debates.service';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { PolticalDebateBoards } from './entities/poltical_debate.entity';
import { OnlineBoardComments } from '../online_boards/entities/online_board_comment.entity';
import { Trials } from '../trials/entities/trial.entity';
import { HumorBoards } from '../humors/entities/humor.entity';
import { HumorComments } from '../humors/entities/humor_comment.entity';
import { PolticalDebateComments } from './entities/poltical_debate_comments.entity';
import { Role } from '../users/types/userRole.type';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdatePolticalDebateDto } from 'src/poltical_debates/dto/update-poltical_debate.dto';
import { Users } from 'src/users/entities/user.entity';

const mockedUser = {
  id: 1,
  role: Role.User,
  createdAt: new Date(),
  updatedAt: new Date(),
  users: new Users(),
  onlineBoard: [new OnlineBoards()],
  onlineBoardComment: [new OnlineBoardComments()],
  trial: [new Trials()],
  humorBoard: [new HumorBoards()],
  humorComment: [new HumorComments()],
  polticalDebateBoards: [new PolticalDebateBoards()],
  polticalDebateComments: [new PolticalDebateComments()],
};

const mockPolticalDebate = {
  id: 1,
  userId: 1,
  title: 'test',
  content: 'test2',
  view: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
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
        {
          provide: polticalDebatesRepositoryToken,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
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

      jest
        .spyOn(polticalDebatesRepository, 'create')
        .mockReturnValue(mockPolticalDebate);

      jest
        .spyOn(polticalDebatesRepository, 'save')
        .mockResolvedValue(mockPolticalDebate);

      const createPolticalDebate = await polticalDebatesService.create(
        mockedUser.users,
        createPolticalDebateDto,
      );

      expect(polticalDebatesRepository.save).toHaveBeenCalledTimes(1);
      expect(createPolticalDebate).toEqual(mockPolticalDebate);
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

  describe('정치 토론 게시판 상세 조회', () => {
    it('성공', async () => {
      const mockPolticalDebateId = 1;
      jest
        .spyOn(polticalDebatesRepository, 'findOne')
        .mockResolvedValue(mockPolticalDebate);

      const findOnePolticalDebateBoard =
        await polticalDebatesService.findOne(mockPolticalDebateId);

      expect(findOnePolticalDebateBoard).toEqual(mockPolticalDebate);
    });

    it('실패: 정치 토론 게시판을 찾을 수 없습니다.', async () => {
      const mockPolticalDebateId = 1000;
      jest.spyOn(polticalDebatesRepository, 'findOne').mockResolvedValue(null);

      await expect(
        polticalDebatesService.findOne(mockPolticalDebateId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('성공', async () => {
      const updatePolticalDebateDto: UpdatePolticalDebateDto = {
        title: 'test2',
        content: 'testtest2',
      };

      jest
        .spyOn(polticalDebatesRepository, 'findOne')
        .mockResolvedValue(mockPolticalDebate);

      jest
        .spyOn(polticalDebatesRepository, 'update')
        .mockResolvedValue({ raw: [], affected: 1 } as UpdateResult);

      const result = await polticalDebatesService.update(
        mockedUser.users,
        mockPolticalDebate.id,
        updatePolticalDebateDto,
      );

      expect(result).toEqual({
        ...mockPolticalDebate,
        ...updatePolticalDebateDto,
      });
    });

    it('실패: 정치 토론 게시판을 찾을 수 없습니다.', async () => {
      const updatePolticalDebateDto: UpdatePolticalDebateDto = {
        title: '타이틀 수정',
        content: '내용 수정',
      };

      const mockPolticalDebateId = 1000;
      jest.spyOn(polticalDebatesRepository, 'findOne').mockResolvedValue(null);

      await expect(
        polticalDebatesService.update(
          mockedUser.users,
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

      jest
        .spyOn(polticalDebatesRepository, 'findOne')
        .mockResolvedValue(mockPolticalDebate);

      mockedUser.id = 2;

      await expect(
        polticalDebatesService.update(
          mockedUser.users,
          mockPolticalDebate.id,
          updatePolticalDebateDto,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('delete', () => {
    it('성공', async () => {
      jest
        .spyOn(polticalDebatesRepository, 'findOne')
        .mockResolvedValue(mockPolticalDebate);

      const result = await polticalDebatesService.delete(
        mockedUser.users,
        mockPolticalDebate.id,
      );

      expect(result).toBeUndefined();
    });

    it('실패: 존재하지 않는 정치 토론 게시판입니다.', async () => {
      const mockPolticalDebateId = 1000;
      jest.spyOn(polticalDebatesRepository, 'findOne').mockResolvedValue(null);

      await expect(
        polticalDebatesService.delete(mockedUser.users, mockPolticalDebateId),
      ).rejects.toThrow(NotFoundException);
    });

    it('실패: 게시판을 삭제할 권한이 없습니다.', async () => {
      jest
        .spyOn(polticalDebatesRepository, 'findOne')
        .mockResolvedValue(mockPolticalDebate);

      mockedUser.id = 2;

      await expect(
        polticalDebatesService.delete(mockedUser.users, mockPolticalDebate.id),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
