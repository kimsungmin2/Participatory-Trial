import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolticalDebateCommentsService } from '../poltical_debates/poltical_debate_comments.service';
import { CreatePolticalDebateCommentDto } from '../poltical_debates/dto/create-poltical_debate_comment_dto';
import { PolticalDebateBoards } from '../poltical_debates/entities/poltical_debate.entity';
import { PolticalDebateComments } from '../poltical_debates/entities/poltical_debate_comments.entity';
import { Users } from '../users/entities/user.entity';
import { Role } from '../users/types/userRole.type';

const mockedUser = {
  id: 1,
  email: 'example@naver.com',
  password: '1',
  nickName: 'test',
  birth: '1992-02-22',
  provider: 'test',
  verifiCationCode: 1,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: null,
};

const mockPolticalDebate = {
  id: 1,
  userId: 1,
  title: '기존 타이틀',
  content: '기존 컨텐츠',
  view: 1,
  createdAt: new Date(),
  updated_at: new Date(),
} as PolticalDebateBoards;

const mockComment = {
  id: 1,
  userId: 1,
  polticalDebateId: 1,
  content: 'test',
  createdAt: new Date(),
  updatedAt: new Date(),
} as PolticalDebateComments;

describe('PolticalDebateCommentsService', () => {
  let polticalDebateCommentsService: PolticalDebateCommentsService;
  let polticalDebateCommentsRepository: Repository<PolticalDebateComments>;
  let polticalDebatesRepository: Repository<PolticalDebateBoards>;

  const polticalDebateCommentsRepositoryToken = getRepositoryToken(
    PolticalDebateComments,
  );
  const polticalDebatesRepositoryToken =
    getRepositoryToken(PolticalDebateBoards);

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolticalDebateCommentsService,
        {
          provide: polticalDebateCommentsRepositoryToken,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            merge: jest.fn(),
          },
        },
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

    polticalDebateCommentsService = module.get<PolticalDebateCommentsService>(
      PolticalDebateCommentsService,
    );

    polticalDebateCommentsRepository = module.get<
      Repository<PolticalDebateComments>
    >(polticalDebateCommentsRepositoryToken);

    polticalDebatesRepository = module.get<Repository<PolticalDebateBoards>>(
      polticalDebatesRepositoryToken,
    );
  });

  it('polticalDebateCommentsService should be defined', () => {
    expect(polticalDebateCommentsService).toBeDefined();
  });

  it('polticalDebateCommentsRepository should be defined', () => {
    expect(polticalDebateCommentsRepository).toBeDefined();
  });

  it('polticalDebatesRepository should be defined', () => {
    expect(polticalDebatesRepository).toBeDefined();
  });

  describe('댓글 생성', () => {
    it('성공', async () => {
      const createPolticalDebateCommentDto: CreatePolticalDebateCommentDto = {
        content: 'test',
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
        .spyOn(polticalDebateCommentsRepository, 'save')
        .mockResolvedValue(mockComment);

      const result = await polticalDebateCommentsService.createComment(
        mockedUser,
        mockPolticalDebateId,
        createPolticalDebateCommentDto,
      );

      expect(polticalDebatesRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPolticalDebateId },
      });

      expect(polticalDebateCommentsRepository.save).toHaveBeenCalledWith({
        userId: mockedUser.id,
        polticalDebateId: mockPolticalDebateId,
        ...createPolticalDebateCommentDto,
      });
      expect(result).toEqual(mockComment);
    });
    it('실패: 게시물을 찾을 수 없습니다.', async () => {
      const createPolticalDebateCommentDto: CreatePolticalDebateCommentDto = {
        content: 'test',
      };

      const mockPolticalDebateId = 1;

      jest.spyOn(polticalDebatesRepository, 'findOne').mockResolvedValue(null);

      await expect(
        polticalDebateCommentsService.createComment(
          mockedUser,
          mockPolticalDebateId,
          createPolticalDebateCommentDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllComments', () => {
    it('성공', async () => {
      const polticalDebateId = 1;
      const mockComments: PolticalDebateComments[] = [mockComment];

      jest
        .spyOn(polticalDebateCommentsRepository, 'find')
        .mockResolvedValue(mockComments);

      const result =
        await polticalDebateCommentsService.getAllComments(polticalDebateId);

      expect(result).toEqual(mockComments);
    });
  });

  describe('getCommentById', () => {
    it('성공', async () => {
      const polticalDebateId = 1;
      const commentId = 1;
      const mockComment = {
        id: 1,
        userId: 1,
        polticalDebateId: 1,
        content: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PolticalDebateComments;

      jest
        .spyOn(polticalDebateCommentsRepository, 'findOne')
        .mockResolvedValue(mockComment);

      const result = await polticalDebateCommentsService.getCommentById(
        polticalDebateId,
        commentId,
      );

      expect(result).toEqual(mockComment);
    });
  });

  describe('updateComment', () => {
    it('성공', async () => {
      const userInfo = { id: 1 };
      const polticalDebateId = 1;
      const commentId = 1;
      const updatePolticalDebateCommentDto: CreatePolticalDebateCommentDto = {
        content: 'Updated content',
      };

      const mockComment: PolticalDebateComments = {
        id: commentId,
        userId: userInfo.id,
        polticalDebateId,
        content: 'Original content',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: new Users(),
        polticalDebateBoard: new PolticalDebateBoards(),
      };

      jest
        .spyOn(polticalDebateCommentsService, 'getCommentById')
        .mockResolvedValue(mockComment);

      jest.spyOn(polticalDebateCommentsRepository, 'merge');
      jest
        .spyOn(polticalDebateCommentsRepository, 'save')
        .mockResolvedValue(mockComment);

      const result = await polticalDebateCommentsService.updateComment(
        mockedUser,
        polticalDebateId,
        commentId,
        updatePolticalDebateCommentDto,
      );

      expect(polticalDebateCommentsService.getCommentById).toHaveBeenCalledWith(
        polticalDebateId,
        commentId,
      );

      expect(polticalDebateCommentsRepository.merge).toHaveBeenCalledWith(
        mockComment,
        updatePolticalDebateCommentDto,
      );

      expect(polticalDebateCommentsRepository.save).toHaveBeenCalled();

      expect(result).toEqual(mockComment);
    });
    it('실패: 정치 토론 게시판을 찾을 수 없습니다.', async () => {
      const polticalDebateId = 1;
      const commentId = 1;
      const updatePolticalDebateCommentDto: CreatePolticalDebateCommentDto = {
        content: 'Updated content',
      };

      jest
        .spyOn(polticalDebateCommentsService, 'getCommentById')
        .mockResolvedValue(null);

      await expect(
        polticalDebateCommentsService.updateComment(
          mockedUser,
          polticalDebateId,
          commentId,
          updatePolticalDebateCommentDto,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(polticalDebateCommentsService.getCommentById).toHaveBeenCalledWith(
        polticalDebateId,
        commentId,
      );
    });
    it('실패: 게시판을 수정할 권한이 없습니다.', async () => {
      const userInfo = { id: 2 };
      const polticalDebateId = 1;
      const commentId = 1;
      const updatePolticalDebateCommentDto: CreatePolticalDebateCommentDto = {
        content: 'Updated content',
      };

      const mockComments = {
        id: commentId,
        userId: userInfo.id,
        polticalDebateId: 1,
        content: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PolticalDebateComments;

      jest
        .spyOn(polticalDebateCommentsService, 'getCommentById')
        .mockResolvedValue(mockComments);

      await expect(
        polticalDebateCommentsService.updateComment(
          mockedUser,
          polticalDebateId,
          commentId,
          updatePolticalDebateCommentDto,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(polticalDebateCommentsService.getCommentById).toHaveBeenCalledWith(
        polticalDebateId,
        commentId,
      );
    });
  });

  describe('deleteComment', () => {
    it('성공', async () => {
      const polticalDebateId = 1;
      const commentId = 1;
      jest
        .spyOn(polticalDebateCommentsService, 'getCommentById')
        .mockResolvedValue(mockComment);

      jest
        .spyOn(polticalDebateCommentsRepository, 'delete')
        .mockResolvedValue(null);

      const result = await polticalDebateCommentsService.deleteComment(
        mockedUser,
        polticalDebateId,
        commentId,
      );

      expect(polticalDebateCommentsService.getCommentById).toHaveBeenCalledWith(
        polticalDebateId,
        commentId,
      );

      expect(polticalDebateCommentsRepository.delete).toHaveBeenCalledWith(
        commentId,
      );

      expect(result).toEqual({ message: '댓글이 삭제되었습니다.' });
    });
    it('실패: 댓글을 찾을 수 없습니다.', async () => {
      const polticalDebateId = 1;
      const commentId = 1;

      jest
        .spyOn(polticalDebateCommentsService, 'getCommentById')
        .mockResolvedValue(null);

      await expect(
        polticalDebateCommentsService.deleteComment(
          mockedUser,
          polticalDebateId,
          commentId,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(polticalDebateCommentsService.getCommentById).toHaveBeenCalledWith(
        polticalDebateId,
        commentId,
      );
    });
    it('실패: 댓글을 삭제할 권한이 없습니다.', async () => {
      const polticalDebateId = 1;
      const commentId = 1;

      const mockComment: PolticalDebateComments = {
        id: commentId,
        userId: 2,
        polticalDebateId,
        content: 'Test comment',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: new Users(),
        polticalDebateBoard: new PolticalDebateBoards(),
      };

      jest
        .spyOn(polticalDebateCommentsService, 'getCommentById')
        .mockResolvedValue(mockComment);

      await expect(
        polticalDebateCommentsService.deleteComment(
          mockedUser,
          polticalDebateId,
          commentId,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(polticalDebateCommentsService.getCommentById).toHaveBeenCalledWith(
        polticalDebateId,
        commentId,
      );
    });
  });
});
