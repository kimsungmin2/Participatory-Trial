import { Test, TestingModule } from '@nestjs/testing';
import { HumorsService } from './humors.service';
import { Role } from '../users/types/userRole.type';
import { UserInfos } from '../users/entities/user-info.entity';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { OnlineBoardComments } from '../online_boards/entities/online_board_comment.entity';
import { Trials } from '../trials/entities/trial.entity';
import { HumorBoards } from './entities/humor-board.entity';
import { HumorComments } from '../humor-comments/entities/humor_comment.entity';
import { PolticalDebateBoards } from '../poltical_debates/entities/poltical_debate.entity';
import { PolticalDebateComments } from '../poltical_debates/entities/poltical_debate_comments.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { CreateHumorBoardDto } from './dto/create-humor.dto';
import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateHumorDto } from './dto/update-humor.dto';
import { forbidden } from 'joi';

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
};
const mockBoard = {
  id: 1,
  content: '냠냠',
  userId: 1,
  like: 1,
  view: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
} as HumorBoards;

describe('HumorsService', () => {
  let humorService: HumorsService;
  let humorBoardRepository: Repository<HumorBoards>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HumorsService,

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
          },
        },
      ],
    }).compile();

    humorService = module.get<HumorsService>(HumorsService);
    humorBoardRepository = module.get<Repository<HumorBoards>>(
      getRepositoryToken(HumorBoards),
    );
  });

  it('should be defined', () => {
    expect(humorService).toBeDefined();
  });
  describe('createHumorBoard', () => {
    const createHumorBoardDto: CreateHumorBoardDto = {
      content: '냠냠',
      title: '냠냠냠',
    };
    it('must be success', async () => {
      jest.spyOn(humorBoardRepository, 'save').mockResolvedValue(mockBoard);
      const createdBoard = await humorService.createHumorBoard(
        createHumorBoardDto,
        mockedUser,
      );
      expect(humorBoardRepository.save).toHaveBeenCalledTimes(1);
      expect(createdBoard).toEqual(mockBoard);
    });
    it('must be save is failed', async () => {
      expect.assertions(3);
      jest.spyOn(humorBoardRepository, 'save').mockRejectedValue(new Error());
      try {
        await humorService.createHumorBoard(createHumorBoardDto, mockedUser);
      } catch (err) {
        expect(err).toBeInstanceOf(InternalServerErrorException);
        expect(err.message).toEqual(
          '예기지 못한 오류로 게시물 생성에 실패했습니다. 다시 시도해주세요.',
        );
      }
      expect(humorBoardRepository.save).toHaveBeenCalledTimes(1);
    });
  });
  describe('getAllHumorBoards', () => {
    const mockBoardArray: HumorBoards[] = [
      {
        id: 1,
      },
    ] as HumorBoards[];
    it('must be success', async () => {
      jest
        .spyOn(humorBoardRepository, 'find')
        .mockResolvedValue(mockBoardArray);
      const createdBoard = await humorService.getAllHumorBoards();
      expect(humorBoardRepository.find).toHaveBeenCalledTimes(1);
      expect(createdBoard).toEqual(mockBoardArray);
    });
    it('must be find is failed', async () => {
      expect.assertions(3);
      jest.spyOn(humorBoardRepository, 'find').mockRejectedValue(new Error());
      try {
        const createdBoard = await humorService.getAllHumorBoards();
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
    const deletedResult: DeleteResult = {
      raw: {},
      affected: 1,
    };
    const failedDeletedResult: DeleteResult = {
      raw: {},
      affected: 0,
    };
    it('must be success', async () => {
      jest
        .spyOn(humorService, 'findOneHumorBoard')
        .mockResolvedValue(mockBoard);
      jest
        .spyOn(humorBoardRepository, 'delete')
        .mockResolvedValue(deletedResult);

      const deletedBoard = await humorService.deleteHumorBoard(
        mockBoard.id,
        mockedUser,
      );
      expect(humorService.findOneHumorBoard).toHaveBeenCalledTimes(1);
      expect(humorBoardRepository.delete).toHaveBeenCalledTimes(1);
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
        .spyOn(humorBoardRepository, 'delete')
        .mockResolvedValue(failedDeletedResult);

      try {
        await humorService.deleteHumorBoard(mockBoard.id, mockedUser);
      } catch (err) {
        expect(err).toBeInstanceOf(InternalServerErrorException);
      }
      expect(humorService.findOneHumorBoard).toHaveBeenCalledTimes(1);
      expect(humorBoardRepository.delete).toHaveBeenCalledTimes(1);
    });
  });
});
