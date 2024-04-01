import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HumorBoards } from 'src/humors/entities/humor.entity';
import { HumorComments } from 'src/humors/entities/humor_comment.entity';
import { OnlineBoards } from 'src/online_boards/entities/online_board.entity';
import { OnlineBoardComments } from 'src/online_boards/entities/online_board_comment.entity';
import { CreatePolticalDebateCommentDto } from 'src/poltical_debates/dto/create-poltical_debate_comment_dto';
import { PolticalDebateBoards } from 'src/poltical_debates/entities/poltical_debate.entity';
import { PolticalDebateComments } from 'src/poltical_debates/entities/poltical_debate_comments.entity';
import { Trials } from 'src/trials/entities/trial.entity';
import { UserInfos } from 'src/users/entities/user-info.entity';
import { Users } from 'src/users/entities/user.entity';
import { Role } from 'src/users/types/userRole.type';
import { DeleteResult, Repository } from 'typeorm';
import { PolticalDebateCommentsService } from './poltical_debate_comments.service';

const mockUser = {
  id: 1,
  role: Role.User,
  createdAt: new Date(),
  updatedAt: new Date(),
  userInfo: new UserInfos(),
  onlineBoard: [new OnlineBoards()],
  onlineBoardComment: [new OnlineBoardComments()],
  trial: [new Trials()],
  humorBoard: [new HumorBoards()],
  humorComment: [new HumorComments()],
  polticalDebateBoards: [new PolticalDebateBoards()],
  polticalDebateComments: [new PolticalDebateComments()],
};

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

      const mockParams = {
        boardId: 1,
        user: mockUser,
      };

      jest
        .spyOn(polticalDebatesRepository, 'findOne')
        .mockResolvedValue({ id: 1 } as PolticalDebateBoards);

      const mockComment = {
        id: 1,
        userId: 1,
        polticalDebateId: 1,
        content: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PolticalDebateComments;

      jest
        .spyOn(polticalDebateCommentsRepository, 'save')
        .mockResolvedValue(mockComment);
      const result = await polticalDebateCommentsService.createComment(
        mockParams.user,
        mockParams.boardId,
        createPolticalDebateCommentDto,
      );
      expect(polticalDebateCommentsRepository.findOne).toHaveBeenCalledTimes(1);
      expect(polticalDebateCommentsRepository.findOne).toHaveBeenCalledWith({
        id: 1,
      });
      expect(result).toEqual(mockComment);
    });
    it('실패: 게시물을 찾을 수 없습니다.', async () => {
      const createPolticalDebateCommentDto: CreatePolticalDebateCommentDto = {
        content: 'test',
      };
      const mockParams = {
        boardId: 1,
        user: mockUser,
      };
      jest.spyOn(polticalDebatesRepository, 'findOne').mockResolvedValue(null);

      await expect(
        polticalDebateCommentsService.createComment(
          mockParams.user,
          mockParams.boardId,
          createPolticalDebateCommentDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCommentById', () => {
    it('성공', async () => {
      const mockPolticalDebateId = 1;
      const mockCommentId = 1;
      const mockComment: PolticalDebateComments = {
        id: mockCommentId,
        userId: 1,
        polticalDebateId: mockPolticalDebateId,
        content: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: new Users(),
        polticalDebateBoard: new PolticalDebateBoards(),
      };
      jest
        .spyOn(polticalDebateCommentsRepository, 'findOne')
        .mockResolvedValueOnce(mockComment);

      const result = await polticalDebateCommentsService.getCommentById(
        mockPolticalDebateId,
        mockCommentId,
      );

      expect(polticalDebateCommentsRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockCommentId,
          polticalDebateBoard: { id: mockPolticalDebateId },
        },
      });
      expect(result).toEqual(mockComment);
    });

    it('실패: 댓글을 찾을 수 없습니다.', async () => {
      const mockPolticalDebateId = 1;
      const mockCommentId = 1;
      jest
        .spyOn(polticalDebateCommentsRepository, 'findOne')
        .mockResolvedValueOnce(null);

      await expect(
        polticalDebateCommentsService.getCommentById(
          mockPolticalDebateId,
          mockCommentId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateComment', () => {
    it('성공', async () => {
      const mockUser = {
        id: 1,
        role: Role.User,
        createdAt: new Date(),
        updatedAt: new Date(),
        userInfo: new UserInfos(),
        onlineBoard: [new OnlineBoards()],
        onlineBoardComment: [new OnlineBoardComments()],
        trial: [new Trials()],
        humorBoard: [new HumorBoards()],
        humorComment: [new HumorComments()],
        polticalDebateBoards: [new PolticalDebateBoards()],
        polticalDebateComments: [new PolticalDebateComments()],
      };

      const mockPolticalDebateId = 1;
      const mockCommentId = 1;
      const mockUpdateDto: CreatePolticalDebateCommentDto = {
        content: 'updated comment',
      };
      const mockComment: PolticalDebateComments = {
        id: mockCommentId,
        userId: mockUser.id,
        polticalDebateId: mockPolticalDebateId,
        content: 'test comment',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: new Users(),
        polticalDebateBoard: new PolticalDebateBoards(),
      };
      jest
        .spyOn(polticalDebateCommentsService, 'getCommentById')
        .mockResolvedValueOnce(mockComment);
      jest
        .spyOn(polticalDebateCommentsRepository, 'merge')
        .mockReturnValueOnce(mockComment);
      jest
        .spyOn(polticalDebateCommentsRepository, 'save')
        .mockResolvedValueOnce(mockComment);

      const result = await polticalDebateCommentsService.updateComment(
        mockUser,
        mockPolticalDebateId,
        mockCommentId,
        mockUpdateDto,
      );

      expect(polticalDebateCommentsService.getCommentById).toHaveBeenCalledWith(
        mockPolticalDebateId,
        mockCommentId,
      );
      expect(polticalDebateCommentsRepository.merge).toHaveBeenCalledWith(
        mockComment,
        mockUpdateDto,
      );
      expect(polticalDebateCommentsRepository.save).toHaveBeenCalledWith(
        mockComment,
      );
      expect(result).toEqual(mockComment);
    });

    it('실패: 댓글을 찾을 수 없습니다.', async () => {
      const mockUser = {
        id: 1,
        role: Role.User,
        createdAt: new Date(),
        updatedAt: new Date(),
        userInfo: new UserInfos(),
        onlineBoard: [new OnlineBoards()],
        onlineBoardComment: [new OnlineBoardComments()],
        trial: [new Trials()],
        humorBoard: [new HumorBoards()],
        humorComment: [new HumorComments()],
        polticalDebateBoards: [new PolticalDebateBoards()],
        polticalDebateComments: [new PolticalDebateComments()],
      };

      const mockUpdateDto: CreatePolticalDebateCommentDto = {
        content: '수정 댓글',
      };

      const mockPolticalDebateId = 1;
      const mockCommentId = 1;
      jest
        .spyOn(polticalDebateCommentsService, 'getCommentById')
        .mockResolvedValueOnce(null);

      await expect(
        polticalDebateCommentsService.updateComment(
          mockUser,
          mockPolticalDebateId,
          mockCommentId,
          mockUpdateDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteComment', () => {
    it('성공', async () => {
      const mockUser = {
        id: 1,
        role: Role.User,
        createdAt: new Date(),
        updatedAt: new Date(),
        userInfo: new UserInfos(),
        onlineBoard: [new OnlineBoards()],
        onlineBoardComment: [new OnlineBoardComments()],
        trial: [new Trials()],
        humorBoard: [new HumorBoards()],
        humorComment: [new HumorComments()],
        polticalDebateBoards: [new PolticalDebateBoards()],
        polticalDebateComments: [new PolticalDebateComments()],
      };
      const mockPolticalDebateId = 1;
      const mockCommentId = 1;
      const mockComment: PolticalDebateComments = {
        id: mockCommentId,
        userId: mockUser.id,
        polticalDebateId: mockPolticalDebateId,
        content: 'test comment',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: new Users(),
        polticalDebateBoard: new PolticalDebateBoards(),
      };
      jest
        .spyOn(polticalDebateCommentsService, 'getCommentById')
        .mockResolvedValueOnce(mockComment);
      jest
        .spyOn(polticalDebateCommentsRepository, 'delete')
        .mockResolvedValueOnce({} as DeleteResult);

      const result = await polticalDebateCommentsService.deleteComment(
        mockUser,
        mockPolticalDebateId,
        mockCommentId,
      );

      expect(polticalDebateCommentsService.getCommentById).toHaveBeenCalledWith(
        mockPolticalDebateId,
        mockCommentId,
      );
      expect(polticalDebateCommentsRepository.delete).toHaveBeenCalledWith(
        mockCommentId,
      );
      expect(result).toEqual({ message: '댓글이 삭제되었습니다.' });
    });
    it('실패: 댓글을 찾을 수 없습니다.', async () => {
      const mockUser = {
        id: 1,
        role: Role.User,
        createdAt: new Date(),
        updatedAt: new Date(),
        userInfo: new UserInfos(),
        onlineBoard: [new OnlineBoards()],
        onlineBoardComment: [new OnlineBoardComments()],
        trial: [new Trials()],
        humorBoard: [new HumorBoards()],
        humorComment: [new HumorComments()],
        polticalDebateBoards: [new PolticalDebateBoards()],
        polticalDebateComments: [new PolticalDebateComments()],
      };
      const mockPolticalDebateId = 1;
      const mockCommentId = 1;
      jest
        .spyOn(polticalDebateCommentsService, 'getCommentById')
        .mockResolvedValueOnce(null);

      await expect(
        polticalDebateCommentsService.deleteComment(
          mockUser,
          mockPolticalDebateId,
          mockCommentId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
