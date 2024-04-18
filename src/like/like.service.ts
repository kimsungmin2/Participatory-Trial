import { Injectable, NotFoundException } from '@nestjs/common';
import { LikeInputDto } from './dto/create-like.dto';
import { BoardType } from '../s3/board-type';
import { HumorBoards } from '../humors/entities/humor-board.entity';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { deflate } from 'zlib';
import { Users } from '../users/entities/user.entity';
import { HumorLike } from '../humors/entities/humor_like.entity';
import { OnlineBoardLike } from '../online_boards/entities/online_board_like.entity';
import { Trials } from '../trials/entities/trial.entity';
import { TrialLike } from '../trials/entities/trials.like.entity';
type boardTypes = HumorBoards | OnlineBoards | Trials;
interface LikeEntity {
  humorBoardId?: number;
  onlineBoardId?: number;
  userId: number;
}
@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(HumorBoards)
    private humorBoardRepository: Repository<HumorBoards>,
    @InjectRepository(OnlineBoards)
    private onlineBoardRepository: Repository<OnlineBoards>,
    @InjectRepository(HumorLike)
    private humorLikeRepository: Repository<HumorLike>,
    @InjectRepository(OnlineBoardLike)
    private onlineLikeRepository: Repository<OnlineBoardLike>,
    @InjectRepository(Trials)
    private trialsRepository: Repository<Trials>,
    @InjectRepository(TrialLike)
    private trialsLikeRepository: Repository<TrialLike>,
  ) {}
  async like(
    boardType: string,
    userId: number,
    boardId: number,
  ): Promise<string> {
    //boardId 아이디
    //boardType 어떤 게시판
    let boardRepository;
    let likeRepository;
    let entityKey: 'humorBoardId' | 'onlineBoardId' | 'trialId';
    //타입 별 의존성 주입
    switch (boardType) {
      case 'humors':
        boardRepository = this.humorBoardRepository;
        likeRepository = this.humorLikeRepository;
        entityKey = `humorBoardId`;
        break;
      case 'onlineBoards':
        boardRepository = this.onlineBoardRepository;
        likeRepository = this.onlineLikeRepository;
        entityKey = `onlineBoardId`;
        break;
      case 'trials':
        boardRepository = this.trialsRepository;
        likeRepository = this.trialsLikeRepository;
        entityKey = 'trialId';
        break;
      default:
        throw new NotFoundException(`${boardType}은 현재 지원되지 않습니다.`);
    }
    const findBoard = await boardRepository.findOneBy({ id: boardId });
    if (!findBoard) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }
    const isLikeExist: HumorLike | OnlineBoardLike | TrialLike =
      await likeRepository.findOne({
        where: {
          [entityKey]: boardId,
          userId,
        },
      });
    if (!isLikeExist) {
      const like = {
        [entityKey]: boardId,
        userId,
      } as DeepPartial<LikeEntity>;
      await likeRepository.save(like);
      await boardRepository.increment({ id: boardId }, 'like', 1);
    } else {
      await likeRepository.remove(isLikeExist);
      await boardRepository.decrement({ id: boardId }, 'like', 1);
    }
    const updatedBoard = await boardRepository.findOneBy({ id: boardId });
    const currentLikes = updatedBoard ? updatedBoard.like : 0;
    return currentLikes;
  }
}
