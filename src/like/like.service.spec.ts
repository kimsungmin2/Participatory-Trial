<<<<<<< HEAD
// import { Test, TestingModule } from '@nestjs/testing';
// import { LikeService } from './like.service';
// import { BoardType } from '../s3/board-type';
// import { Users } from '../users/entities/user.entity';
// import { NotFoundException } from '@nestjs/common';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { HumorBoards } from '../humors/entities/humor-board.entity';
// import { OnlineBoards } from '../online_boards/entities/online_board.entity';
// import { HumorLike } from '../humors/entities/humor_like.entity';
// import { OnlineBoardLike } from '../online_boards/entities/online_board_like.entity';
// import { Repository } from 'typeorm';

// const mockUser = {
//   id: 1,
// } as Users;
// describe('LikeService', () => {
//   let service: LikeService;
//   let humorBoardRepositoryMock: Repository<HumorBoards>;
//   let onlineBoardRepositoryMock: Repository<OnlineBoards>;
//   let humorLikeRepositoryMock: Repository<HumorLike>;
//   let onlineLikeRepositoryMock: Repository<OnlineBoardLike>;
=======
import { Test, TestingModule } from '@nestjs/testing';
import { LikeService } from './like.service';
import { BoardType } from '../s3/board-type';
import { Users } from '../users/entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HumorBoards } from '../humors/entities/humor-board.entity';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { HumorLike } from '../humors/entities/humor_like.entity';
import { OnlineBoardLike } from '../online_boards/entities/online_board_like.entity';
import { Repository } from 'typeorm';
import { Trials } from '../trials/entities/trial.entity';
import { TrialLike } from '../trials/entities/trials.like.entity';
import { date } from 'joi';

const mockUser = {
  id: 1,
} as Users;
describe('LikeService', () => {
  let service: LikeService;
  let humorBoardRepositoryMock: Repository<HumorBoards>;
  let onlineBoardRepositoryMock: Repository<OnlineBoards>;
  let humorLikeRepositoryMock: Repository<HumorLike>;
  let onlineLikeRepositoryMock: Repository<OnlineBoardLike>;
  let trialsRepository: Repository<Trials>;
  let trialsLikeRepository: Repository<TrialLike>;
>>>>>>> da7020fe87bcd39883ce31aa7775e566ad34ba17

//   beforeEach(async () => {
//     jest.clearAllMocks();
//     jest.resetAllMocks();
//     // 모의 객체 생성

<<<<<<< HEAD
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         LikeService,
//         // 다른 의존성이 있다면 여기에 추가
//         {
//           provide: getRepositoryToken(HumorBoards),
//           useValue: {
//             findOneBy: jest.fn(),
//             increment: jest.fn(),
//             decrement: jest.fn(),
//           },
//         },
//         {
//           provide: getRepositoryToken(OnlineBoards),
//           useValue: {
//             findOneBy: jest.fn(),
//             increment: jest.fn(),
//             decrement: jest.fn(),
//           },
//         },
//         {
//           provide: getRepositoryToken(HumorLike),
//           useValue: {
//             findOne: jest.fn(),
//             save: jest.fn(),
//             remove: jest.fn(),
//           },
//         },
//         {
//           provide: getRepositoryToken(OnlineBoardLike),
//           useValue: {
//             findOne: jest.fn(),
//             save: jest.fn(),
//             remove: jest.fn(),
//           },
//         },
//       ],
//     }).compile();
=======
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikeService,
        // 다른 의존성이 있다면 여기에 추가
        {
          provide: getRepositoryToken(HumorBoards),
          useValue: {
            findOneBy: jest.fn(),
            increment: jest.fn(),
            decrement: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OnlineBoards),
          useValue: {
            findOneBy: jest.fn(),
            increment: jest.fn(),
            decrement: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(HumorLike),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OnlineBoardLike),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Trials),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(TrialLike),
          useClass: Repository,
        },
      ],
    }).compile();
>>>>>>> da7020fe87bcd39883ce31aa7775e566ad34ba17

//     service = module.get<LikeService>(LikeService);

<<<<<<< HEAD
//     humorLikeRepositoryMock = module.get<Repository<HumorLike>>(
//       getRepositoryToken(HumorLike),
//     );
//     onlineBoardRepositoryMock = module.get<Repository<OnlineBoards>>(
//       getRepositoryToken(OnlineBoards),
//     );
//     onlineLikeRepositoryMock = module.get<Repository<OnlineBoardLike>>(
//       getRepositoryToken(OnlineBoardLike),
//     );
//     humorBoardRepositoryMock = module.get<Repository<HumorBoards>>(
//       getRepositoryToken(HumorBoards),
//     );
//   });

//   it('should like a post successfully', async () => {
//     jest.spyOn(humorBoardRepositoryMock, 'findOneBy').mockResolvedValue({
//       id: 1,
//     } as HumorBoards);
//     jest.spyOn(humorLikeRepositoryMock, 'findOne').mockResolvedValue(null);
//     const result = await service.like(
//       { boardType: BoardType.Humor },
//       mockUser,
//       1,
//     );

//     expect(result).toEqual('좋아요 성공');
//     expect(humorLikeRepositoryMock.save).toHaveBeenCalled();
//     expect(humorBoardRepositoryMock.increment).toHaveBeenCalled();
//   });

//   it('should like a post successfully if already liked', async () => {
//     jest.spyOn(humorBoardRepositoryMock, 'findOneBy').mockResolvedValue({
//       id: 1,
//     } as HumorBoards);
//     jest.spyOn(humorLikeRepositoryMock, 'findOne').mockResolvedValue({
//       // `HumorLike` 엔티티의 속성에 해당하는 값을 제공합니다.
//       // 이는 예시이므로, 실제 `HumorLike` 엔티티의 구조에 따라 조정해야 합니다.
//       id: 1,
//       userId: 1,
//       humorBoardId: 1,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     } as unknown as HumorLike);

//     const result = await service.like(
//       { boardType: BoardType.Humor },
//       mockUser,
//       1,
//     );

//     expect(result).toEqual('좋아요 취소 성공');
//     expect(humorLikeRepositoryMock.remove).toHaveBeenCalled();
//     expect(humorBoardRepositoryMock.decrement).toHaveBeenCalled();
//   });

//   it('should throw NotFoundException if the post does not exist', async () => {
//     // 게시물을 찾을 수 없는 경우에 대한 테스트
//     jest.spyOn(humorBoardRepositoryMock, 'findOneBy').mockResolvedValue(null);

//     await expect(
//       service.like({ boardType: BoardType.Humor }, mockUser, 1),
//     ).rejects.toThrow(NotFoundException);
//   });

//   // 여기에 더 많은 테스트 케이스를 추가할 수 있습니다.
// });
=======
    humorLikeRepositoryMock = module.get<Repository<HumorLike>>(
      getRepositoryToken(HumorLike),
    );
    onlineBoardRepositoryMock = module.get<Repository<OnlineBoards>>(
      getRepositoryToken(OnlineBoards),
    );
    onlineLikeRepositoryMock = module.get<Repository<OnlineBoardLike>>(
      getRepositoryToken(OnlineBoardLike),
    );
    humorBoardRepositoryMock = module.get<Repository<HumorBoards>>(
      getRepositoryToken(HumorBoards),
    );
    trialsRepository = module.get<Repository<Trials>>(
      getRepositoryToken(Trials),
    );
    trialsLikeRepository = module.get<Repository<TrialLike>>(
      getRepositoryToken(TrialLike),
    );
  });
  describe('like method', () => {
    const mockLike = {
      id: 1,
    } as unknown as HumorLike;
    it('should like a post successfully with humor', async () => {
      jest.spyOn(humorBoardRepositoryMock, 'findOneBy').mockResolvedValue({
        id: 1,
      } as HumorBoards);
      jest.spyOn(humorLikeRepositoryMock, 'findOne').mockResolvedValue(null);
      jest.spyOn(humorLikeRepositoryMock, 'save').mockResolvedValue(null);
      jest.spyOn(humorBoardRepositoryMock, 'increment').mockResolvedValue(null);

      const result = await service.like(1, 1, 'humors');

      // expect(result).toEqual('좋아요 성공');
      expect(humorLikeRepositoryMock.save).toHaveBeenCalledTimes(1);
      expect(humorBoardRepositoryMock.increment).toHaveBeenCalledTimes(1);
    });

    it('should like a post successfully if already liked', async () => {
      jest.spyOn(humorBoardRepositoryMock, 'findOneBy').mockResolvedValue({
        id: 1,
      } as HumorBoards);
      jest
        .spyOn(humorLikeRepositoryMock, 'findOne')
        .mockResolvedValue(mockLike);
      jest.spyOn(humorLikeRepositoryMock, 'remove').mockResolvedValue(null);
      jest.spyOn(humorBoardRepositoryMock, 'decrement').mockResolvedValue(null);

      const result = await service.like(1, 1, 'humors');

      // expect(result).toEqual('좋아요 성공');
      expect(humorLikeRepositoryMock.remove).toHaveBeenCalledTimes(1);
      expect(humorBoardRepositoryMock.decrement).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if the post does not exist', async () => {
      // 게시물을 찾을 수 없는 경우에 대한 테스트
      jest.spyOn(humorBoardRepositoryMock, 'findOneBy').mockResolvedValue(null);

      await expect(service.like(1, 1, 'humor')).rejects.toThrow(
        NotFoundException,
      );
    });

    // 여기에 더 많은 테스트 케이스를 추가할 수 있습니다.
  });
});


>>>>>>> da7020fe87bcd39883ce31aa7775e566ad34ba17
