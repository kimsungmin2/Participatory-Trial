import { Test, TestingModule } from '@nestjs/testing';
import { LikeService } from '../like/like.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HumorBoards } from '../humors/entities/humor-board.entity';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { HumorLike } from '../humors/entities/humor_like.entity';
import { OnlineBoardLike } from '../online_boards/entities/online_board_like.entity';
import { Trials } from '../trials/entities/trial.entity';
import { TrialLike } from '../trials/entities/trials.like.entity';
import { NotFoundException } from '@nestjs/common';

describe('LikeService', () => {
  let service: LikeService;
  let humorBoardRepository: Repository<HumorBoards>;
  let onlineBoardRepository: Repository<OnlineBoards>;
  let humorLikeRepository: Repository<HumorLike>;
  let onlineLikeRepository: Repository<OnlineBoardLike>;
  let trialsRepository: Repository<Trials>;
  let trialsLikeRepository: Repository<TrialLike>;

  const mockRepository = {
    findOneBy: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockLikeRepository = {
    findOne: jest.fn(),
    save: jest.fn(), // save 메서드 추가
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikeService,
        {
          provide: getRepositoryToken(HumorBoards),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(OnlineBoards),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(HumorLike),
          useValue: mockLikeRepository,
        },
        {
          provide: getRepositoryToken(OnlineBoardLike),
          useValue: mockLikeRepository,
        },
        { provide: getRepositoryToken(Trials), useValue: mockRepository },
        {
          provide: getRepositoryToken(TrialLike),
          useValue: mockLikeRepository,
        },
      ],
    }).compile();

    service = module.get<LikeService>(LikeService);
    humorBoardRepository = module.get(getRepositoryToken(HumorBoards));
    onlineBoardRepository = module.get(getRepositoryToken(OnlineBoards));
    humorLikeRepository = module.get(getRepositoryToken(HumorLike));
    onlineLikeRepository = module.get(getRepositoryToken(OnlineBoardLike));
    trialsRepository = module.get(getRepositoryToken(Trials));
    trialsLikeRepository = module.get(getRepositoryToken(TrialLike));
  });

  describe('like', () => {
    it('should create a new like if not already liked', async () => {
      const boardType = 'humors';
      const userId = 1;
      const boardId = 1;

      mockRepository.findOneBy.mockResolvedValue({
        id: boardId,
        like: 0,
      });
      mockLikeRepository.findOne.mockResolvedValue(null);

      await service.like(boardType, userId, boardId);

      expect(humorLikeRepository.save).toHaveBeenCalled();
      expect(humorBoardRepository.increment).toHaveBeenCalledWith(
        { id: boardId },
        'like',
        1,
      );
    });

    it('should remove like if already liked', async () => {
      const boardType = 'humors';
      const userId = 1;
      const boardId = 1;

      mockRepository.findOneBy.mockResolvedValue({
        id: boardId,
        like: 1,
      });
      mockLikeRepository.findOne.mockResolvedValue({
        id: 1,
        userId,
        humorBoardId: boardId,
      });

      await service.like(boardType, userId, boardId);

      expect(humorLikeRepository.remove).toHaveBeenCalled();
      expect(humorBoardRepository.decrement).toHaveBeenCalledWith(
        { id: boardId },
        'like',
        1,
      );
    });

    it('should throw NotFoundException if the board does not exist', async () => {
      const boardType = 'humors';
      const userId = 1;
      const boardId = 1;

      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.like(boardType, userId, boardId)).rejects.toThrow(
        new NotFoundException('게시물을 찾을 수 없습니다.'),
      );
    });
    it('should create a new like if not already liked', async () => {
      const boardType = 'trials';
      const userId = 1;
      const boardId = 1;

      mockRepository.findOneBy.mockResolvedValue({
        id: boardId,
        like: 0,
      });
      mockLikeRepository.findOne.mockResolvedValue(null);

      await service.like(boardType, userId, boardId);

      expect(humorLikeRepository.save).toHaveBeenCalled();
      expect(humorBoardRepository.increment).toHaveBeenCalledWith(
        { id: boardId },
        'like',
        1,
      );
    });

    it('should remove like if already liked', async () => {
      const boardType = 'trials';
      const userId = 1;
      const boardId = 1;

      mockRepository.findOneBy.mockResolvedValue({
        id: boardId,
        like: 1,
      });
      mockLikeRepository.findOne.mockResolvedValue({
        id: 1,
        userId,
        humorBoardId: boardId,
      });

      await service.like(boardType, userId, boardId);

      expect(humorLikeRepository.remove).toHaveBeenCalled();
      expect(humorBoardRepository.decrement).toHaveBeenCalledWith(
        { id: boardId },
        'like',
        1,
      );
    });

    it('should throw NotFoundException if the board does not exist', async () => {
      const boardType = 'trials';
      const userId = 1;
      const boardId = 1;

      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.like(boardType, userId, boardId)).rejects.toThrow(
        new NotFoundException('게시물을 찾을 수 없습니다.'),
      );
    });
    it('should create a new like if not already liked', async () => {
      const boardType = 'online-boards';
      const userId = 1;
      const boardId = 1;

      mockRepository.findOneBy.mockResolvedValue({
        id: boardId,
        like: 0,
      });
      mockLikeRepository.findOne.mockResolvedValue(null);

      await service.like(boardType, userId, boardId);

      expect(humorLikeRepository.save).toHaveBeenCalled();
      expect(humorBoardRepository.increment).toHaveBeenCalledWith(
        { id: boardId },
        'like',
        1,
      );
    });

    it('should remove like if already liked', async () => {
      const boardType = 'online-boards';
      const userId = 1;
      const boardId = 1;

      mockRepository.findOneBy.mockResolvedValue({
        id: boardId,
        like: 1,
      });
      mockLikeRepository.findOne.mockResolvedValue({
        id: 1,
        userId,
        humorBoardId: boardId,
      });

      await service.like(boardType, userId, boardId);

      expect(humorLikeRepository.remove).toHaveBeenCalled();
      expect(humorBoardRepository.decrement).toHaveBeenCalledWith(
        { id: boardId },
        'like',
        1,
      );
    });

    it('should throw NotFoundException if the board does not exist', async () => {
      const boardType = 'online-boards';
      const userId = 1;
      const boardId = 1;

      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.like(boardType, userId, boardId)).rejects.toThrow(
        new NotFoundException('게시물을 찾을 수 없습니다.'),
      );
    });
  });
});
