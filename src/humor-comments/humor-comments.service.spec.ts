import { Test, TestingModule } from '@nestjs/testing';
import { HumorCommentsService } from './humor-comments.service';
import { HumorComments } from './entities/humor_comment.entity';
import { HumorBoards } from '../humors/entities/humor-board.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from '../users/types/userRole.type';
import { UserInfos } from '../users/entities/user-info.entity';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';

import { Trials } from '../trials/entities/trial.entity';
import { PolticalDebateBoards } from '../poltical_debates/entities/poltical_debate.entity';
import { PolticalDebateComments } from '../poltical_debates/entities/poltical_debate_comments.entity';
import { DeleteResult, Repository } from 'typeorm';
import { date } from 'joi';
import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Users } from '../users/entities/user.entity';
import { OnlineBoardComments } from '../online_board_comment/entities/online_board_comment.entity';

const mockedUser = {
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
} as Users;

describe('HumorCommentsService', () => {
  let humorCommentsService: HumorCommentsService;
  let humorCommentRepository: Repository<HumorComments>;
  let humorBoardRepository: Repository<HumorBoards>;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HumorCommentsService,
        {
          provide: getRepositoryToken(HumorBoards),
          useValue: {
            findOneBy: jest.fn(),
            save: jest.fn(),
            findBy: jest.fn(),
            findOne: jest.fn(),
            merge: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(HumorComments),
          useValue: {
            save: jest.fn(),
            findBy: jest.fn(),
            findOne: jest.fn(),
            merge: jest.fn(),
            delete: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    humorCommentsService =
      module.get<HumorCommentsService>(HumorCommentsService);
    humorCommentRepository = module.get<Repository<HumorComments>>(
      getRepositoryToken(HumorComments),
    );
    humorBoardRepository = module.get<Repository<HumorBoards>>(
      getRepositoryToken(HumorBoards),
    );
  });

  it('should be defined', () => {
    expect(humorCommentsService).toBeDefined();
  });

  describe('humorCommentsService Methods', () => {
    describe('createComment', () => {
      it('must be success', async () => {
        const createHumorCommentDto = {
          content: 'mocked comment content',
        };
        const mockParams = {
          boardId: 1,
          user: mockedUser,
        };
        jest.spyOn(humorBoardRepository, 'findOneBy').mockResolvedValue({
          id: 1,
        } as HumorBoards);
        const mockComment = {
          id: 1,
          content: createHumorCommentDto.content,
          userId: mockedUser.id,
          humorBoardId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as HumorComments;
        jest
          .spyOn(humorCommentRepository, 'save')
          .mockResolvedValue(mockComment);
        const result = await humorCommentsService.createComment(
          createHumorCommentDto,
          mockParams.boardId,
          mockParams.user,
        );
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(humorCommentRepository.save).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockComment);
      });
      it('must be failed found Board', async () => {
        expect.assertions(4);
        const createHumorCommentDto = {
          content: 'mocked comment content',
        };
        const mockParams = {
          boardId: 1,
          user: mockedUser,
        };
        jest.spyOn(humorBoardRepository, 'findOneBy').mockResolvedValue(null);
        try {
          await humorCommentsService.createComment(
            createHumorCommentDto,
            mockParams.boardId,
            mockParams.user,
          );
        } catch (err) {
          expect(err).toBeInstanceOf(NotFoundException);
        }
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(humorCommentRepository.save).toHaveBeenCalledTimes(0);
      });
    });
    describe('findAllComment Method', () => {
      it('must be success', async () => {
        const mockParams = {
          boardId: 1,
        };
        const mockComments = [
          {
            id: 1,
            content: 'i am comment',
          },
        ] as HumorComments[];
        const mockBoard = {
          id: 1,
        } as HumorBoards;
        jest
          .spyOn(humorBoardRepository, 'findOneBy')
          .mockResolvedValue(mockBoard);
        jest
          .spyOn(humorCommentRepository, 'find')
          .mockResolvedValue(mockComments);
        const result = await humorCommentsService.findAllComment(
          mockParams.boardId,
        );
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(humorCommentRepository.find).toHaveBeenCalledTimes(1);
        expect(humorCommentRepository.find).toHaveBeenCalledWith({
          where: { humorBoardId: 1 },
        });
        expect(result).toEqual(mockComments);
      });
      it('must be fail found board', async () => {
        expect.assertions(4);
        const mockParams = {
          boardId: 1,
        };
        const mockComments = [
          {
            id: 1,
            content: 'i am comment',
          },
        ] as HumorComments[];
        const mockBoard = {
          id: 1,
        } as HumorBoards;
        jest.spyOn(humorBoardRepository, 'findOneBy').mockResolvedValue(null);
        try {
          const result = await humorCommentsService.findAllComment(
            mockParams.boardId,
          );
        } catch (err) {
          expect(err).toBeInstanceOf(NotFoundException);
        }
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(humorCommentRepository.find).toHaveBeenCalledTimes(0);
      });
    });
    describe('findOneComment Method', () => {
      it('must be success', async () => {
        const mockParams = {
          boardId: 1,
          commentId: 1,
        };
        const mockComment = {
          id: 1,
          content: 'i am comment',
        } as HumorComments;

        const mockBoard = {
          id: 1,
        } as HumorBoards;
        jest
          .spyOn(humorBoardRepository, 'findOneBy')
          .mockResolvedValue(mockBoard);
        jest
          .spyOn(humorCommentRepository, 'findOne')
          .mockResolvedValue(mockComment);
        const result = await humorCommentsService.findOneComment(
          mockParams.boardId,
          mockParams.commentId,
        );
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(humorCommentRepository.findOne).toHaveBeenCalledTimes(1);
        expect(humorCommentRepository.findOne).toHaveBeenCalledWith({
          where: { humorBoardId: 1, id: 1 },
        });
        expect(result).toEqual(mockComment);
      });
      it('must be fail found board', async () => {
        expect.assertions(5);
        const mockParams = {
          boardId: 1,
          commentId: 1,
        };
        const mockBoard = {
          id: 1,
        } as HumorBoards;
        jest.spyOn(humorBoardRepository, 'findOneBy').mockResolvedValue(null);
        try {
          await humorCommentsService.findOneComment(
            mockParams.boardId,
            mockParams.commentId,
          );
        } catch (err) {
          expect(err).toBeInstanceOf(NotFoundException);
          expect(err.message).toEqual('1번 게시물을 찾을 수 없습니다.');
        }
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(humorCommentRepository.findOne).toHaveBeenCalledTimes(0);
      });
      it('must be fail found comment', async () => {
        expect.assertions(5);
        const mockParams = {
          boardId: 1,
          commentId: 1,
        };
        const mockBoard = {
          id: 1,
        } as HumorBoards;
        jest
          .spyOn(humorBoardRepository, 'findOneBy')
          .mockResolvedValue(mockBoard);
        jest.spyOn(humorCommentRepository, 'findOne').mockResolvedValue(null);
        try {
          await humorCommentsService.findOneComment(
            mockParams.boardId,
            mockParams.commentId,
          );
        } catch (err) {
          expect(err).toBeInstanceOf(NotFoundException);
          expect(err.message).toEqual('1번 댓글을 찾을 수 없습니다.');
        }
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(humorCommentRepository.findOne).toHaveBeenCalledTimes(1);
      });
    });
    describe('updateComment Method', () => {
      it('must be success', async () => {
        const mockParams = {
          boardId: 1,
          commentId: 1,
        };
        const updateHumorCommentDto = {
          content: 'update content',
        };
        const mockComment = {
          id: 1,
          content: 'i am comment',
          userId: 1,
        } as HumorComments;
        const updatedComment = {
          id: 1,
          content: 'update content',
          userId: 1,
        } as HumorComments;

        const mockBoard = {
          id: 1,
        } as HumorBoards;
        jest
          .spyOn(humorBoardRepository, 'findOneBy')
          .mockResolvedValue(mockBoard);
        jest
          .spyOn(humorCommentRepository, 'findOne')
          .mockResolvedValue(mockComment);
        jest
          .spyOn(humorCommentRepository, 'merge')
          .mockReturnValue(updatedComment);
        jest
          .spyOn(humorCommentRepository, 'save')
          .mockResolvedValue(updatedComment);
        const result = await humorCommentsService.updateComment(
          mockParams.boardId,
          mockParams.commentId,
          updateHumorCommentDto,
          mockedUser,
        );
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(humorCommentRepository.findOne).toHaveBeenCalledTimes(1);
        expect(humorCommentRepository.findOne).toHaveBeenCalledWith({
          where: { humorBoardId: 1, id: 1 },
        });
        expect(humorCommentRepository.merge).toHaveBeenCalledTimes(1);
        expect(humorCommentRepository.save).toHaveBeenCalledTimes(1);
        expect(humorCommentRepository.save).toHaveBeenCalledWith(
          updatedComment,
        );
        expect(result).toEqual(updatedComment);
      });
      it('must be fail found board', async () => {
        expect.assertions(7);
        const mockParams = {
          boardId: 1,
          commentId: 1,
        };
        const mockBoard = {
          id: 1,
        } as HumorBoards;
        const updateHumorCommentDto = {
          content: 'update content',
        };
        jest.spyOn(humorBoardRepository, 'findOneBy').mockResolvedValue(null);
        try {
          await humorCommentsService.updateComment(
            mockParams.boardId,
            mockParams.commentId,
            updateHumorCommentDto,
            mockedUser,
          );
        } catch (err) {
          expect(err).toBeInstanceOf(NotFoundException);
          expect(err.message).toEqual('1번 게시물을 찾을 수 없습니다.');
        }
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(humorCommentRepository.findOne).toHaveBeenCalledTimes(0);
        expect(humorCommentRepository.merge).toHaveBeenCalledTimes(0);
        expect(humorCommentRepository.save).toHaveBeenCalledTimes(0);
      });
      it('must be fail found comment', async () => {
        expect.assertions(7);
        const mockParams = {
          boardId: 1,
          commentId: 1,
        };
        const mockBoard = {
          id: 1,
        } as HumorBoards;
        const updateHumorCommentDto = {
          content: 'update content',
        };
        jest
          .spyOn(humorBoardRepository, 'findOneBy')
          .mockResolvedValue(mockBoard);
        jest.spyOn(humorCommentRepository, 'findOne').mockResolvedValue(null);
        try {
          await humorCommentsService.updateComment(
            mockParams.boardId,
            mockParams.commentId,
            updateHumorCommentDto,
            mockedUser,
          );
        } catch (err) {
          expect(err).toBeInstanceOf(NotFoundException);
          expect(err.message).toEqual('1번 댓글을 찾을 수 없습니다.');
        }
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(humorCommentRepository.findOne).toHaveBeenCalledTimes(1);
        expect(humorCommentRepository.save).toHaveBeenCalledTimes(0);
        expect(humorCommentRepository.findOne).toHaveBeenCalledTimes(1);
      });
      it('must be fail by userId did not match', async () => {
        expect.assertions(7);
        const mockParams = {
          boardId: 1,
          commentId: 1,
        };
        const mockBoard = {
          id: 1,
        } as HumorBoards;
        const mockComment = {
          id: 1,
          content: 'i am comment',
          userId: 100,
        } as HumorComments;
        const updateHumorCommentDto = {
          content: 'update content',
        };
        jest
          .spyOn(humorBoardRepository, 'findOneBy')
          .mockResolvedValue(mockBoard);
        jest
          .spyOn(humorCommentRepository, 'findOne')
          .mockResolvedValue(mockComment);
        try {
          await humorCommentsService.updateComment(
            mockParams.boardId,
            mockParams.commentId,
            updateHumorCommentDto,
            mockedUser,
          );
        } catch (err) {
          expect(err).toBeInstanceOf(ForbiddenException);
          expect(err.message).toEqual('해당 댓글을 수정할 권한이 없습니다.');
        }
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(humorCommentRepository.findOne).toHaveBeenCalledTimes(1);
        expect(humorCommentRepository.save).toHaveBeenCalledTimes(0);
        expect(humorCommentRepository.findOne).toHaveBeenCalledTimes(1);
      });
      it('must be fail by save failed', async () => {
        expect.assertions(8);
        const mockParams = {
          boardId: 1,
          commentId: 1,
        };
        const updateHumorCommentDto = {
          content: 'update content',
        };
        const mockComment = {
          id: 1,
          content: 'i am comment',
          userId: 1,
        } as HumorComments;
        const updatedComment = {
          id: 1,
          content: 'update content',
          userId: 1,
        } as HumorComments;

        const mockBoard = {
          id: 1,
        } as HumorBoards;
        jest
          .spyOn(humorBoardRepository, 'findOneBy')
          .mockResolvedValue(mockBoard);
        jest
          .spyOn(humorCommentRepository, 'findOne')
          .mockResolvedValue(mockComment);
        jest
          .spyOn(humorCommentRepository, 'merge')
          .mockReturnValue(updatedComment);
        jest
          .spyOn(humorCommentRepository, 'save')
          .mockRejectedValue(new Error());
        try {
          await humorCommentsService.updateComment(
            mockParams.boardId,
            mockParams.commentId,
            updateHumorCommentDto,
            mockedUser,
          );
        } catch (err) {
          expect(err).toBeInstanceOf(InternalServerErrorException);
        }
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(humorCommentRepository.findOne).toHaveBeenCalledTimes(1);
        expect(humorCommentRepository.findOne).toHaveBeenCalledWith({
          where: { humorBoardId: 1, id: 1 },
        });
        expect(humorCommentRepository.merge).toHaveBeenCalledTimes(1);
        expect(humorCommentRepository.save).toHaveBeenCalledTimes(1);
        expect(humorCommentRepository.save).toHaveBeenCalledWith(
          updatedComment,
        );
      });
    });
    describe('deleteHumorComment Method', () => {
      it('must be success', async () => {
        const mockParams = {
          boardId: 1,
          commentId: 1,
        };
        const mockComment = {
          id: 1,
          content: 'i am comment',
          userId: 1,
        } as HumorComments;

        const mockBoard = {
          id: 1,
        } as HumorBoards;
        const deletedComment: DeleteResult = {
          raw: {},
          affected: 1,
        };
        jest
          .spyOn(humorBoardRepository, 'findOneBy')
          .mockResolvedValue(mockBoard);
        jest
          .spyOn(humorCommentRepository, 'findOne')
          .mockResolvedValue(mockComment);
        jest
          .spyOn(humorCommentRepository, 'delete')
          .mockResolvedValue(deletedComment);
        const result = await humorCommentsService.deleteHumorComment(
          mockParams.boardId,
          mockParams.commentId,
          mockedUser,
        );
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(humorCommentRepository.findOne).toHaveBeenCalledTimes(1);
        expect(humorCommentRepository.findOne).toHaveBeenCalledWith({
          where: { humorBoardId: 1, id: 1 },
        });
        expect(humorCommentRepository.delete).toHaveBeenCalledTimes(1);
        expect(result).toEqual(deletedComment);
      });
      it('must be fail found board', async () => {
        expect.assertions(6);
        const mockParams = {
          boardId: 1,
          commentId: 1,
        };
        const mockBoard = {
          id: 1,
        } as HumorBoards;
        const updateHumorCommentDto = {
          content: 'update content',
        };
        jest.spyOn(humorBoardRepository, 'findOneBy').mockResolvedValue(null);
        try {
          await humorCommentsService.deleteHumorComment(
            mockParams.boardId,
            mockParams.commentId,
            mockedUser,
          );
        } catch (err) {
          expect(err).toBeInstanceOf(NotFoundException);
          expect(err.message).toEqual('1번 게시물을 찾을 수 없습니다.');
        }
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(humorCommentRepository.findOne).toHaveBeenCalledTimes(0);
        expect(humorCommentRepository.delete).toHaveBeenCalledTimes(0);
      });
      it('must be fail found comment', async () => {
        expect.assertions(6);
        const mockParams = {
          boardId: 1,
          commentId: 1,
        };
        const mockBoard = {
          id: 1,
        } as HumorBoards;

        jest
          .spyOn(humorBoardRepository, 'findOneBy')
          .mockResolvedValue(mockBoard);
        jest.spyOn(humorCommentRepository, 'findOne').mockResolvedValue(null);
        try {
          await humorCommentsService.deleteHumorComment(
            mockParams.boardId,
            mockParams.commentId,
            mockedUser,
          );
        } catch (err) {
          expect(err).toBeInstanceOf(NotFoundException);
          expect(err.message).toEqual('1번 댓글을 찾을 수 없습니다.');
        }
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(humorCommentRepository.findOne).toHaveBeenCalledTimes(1);
        expect(humorCommentRepository.delete).toHaveBeenCalledTimes(0);
      });
      it('must be fail by userId did not match', async () => {
        expect.assertions(6);
        const mockParams = {
          boardId: 1,
          commentId: 1,
        };
        const mockBoard = {
          id: 1,
        } as HumorBoards;
        const mockComment = {
          id: 1,
          content: 'i am comment',
          userId: 100,
        } as HumorComments;
        jest
          .spyOn(humorBoardRepository, 'findOneBy')
          .mockResolvedValue(mockBoard);
        jest
          .spyOn(humorCommentRepository, 'findOne')
          .mockResolvedValue(mockComment);
        try {
          await humorCommentsService.deleteHumorComment(
            mockParams.boardId,
            mockParams.commentId,
            mockedUser,
          );
        } catch (err) {
          expect(err).toBeInstanceOf(ForbiddenException);
          expect(err.message).toEqual('해당 댓글을 삭제할 권한이 없습니다.');
        }
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(humorCommentRepository.findOne).toHaveBeenCalledTimes(1);
        expect(humorCommentRepository.delete).toHaveBeenCalledTimes(0);
      });
      it('must be fail by delete failed', async () => {
        expect.assertions(7);
        const mockParams = {
          boardId: 1,
          commentId: 1,
        };
        const mockComment = {
          id: 1,
          content: 'i am comment',
          userId: 1,
        } as HumorComments;

        const mockBoard = {
          id: 1,
        } as HumorBoards;
        const failDeletedComment: DeleteResult = {
          raw: {},
          affected: 0,
        };
        jest
          .spyOn(humorBoardRepository, 'findOneBy')
          .mockResolvedValue(mockBoard);
        jest
          .spyOn(humorCommentRepository, 'findOne')
          .mockResolvedValue(mockComment);
        jest
          .spyOn(humorCommentRepository, 'delete')
          .mockResolvedValue(failDeletedComment);
        try {
          const result = await humorCommentsService.deleteHumorComment(
            mockParams.boardId,
            mockParams.commentId,
            mockedUser,
          );
        } catch (err) {
          expect(err).toBeInstanceOf(InternalServerErrorException);
          expect(err.message).toEqual(
            '댓글 삭제 중 예기치 못한 오류가 발생하였습니다. 다시 시도해주세요.',
          );
        }
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
        expect(humorBoardRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(humorCommentRepository.findOne).toHaveBeenCalledTimes(1);
        expect(humorCommentRepository.findOne).toHaveBeenCalledWith({
          where: { humorBoardId: 1, id: 1 },
        });
        expect(humorCommentRepository.delete).toHaveBeenCalledTimes(1);
      });
    });
  });
});
