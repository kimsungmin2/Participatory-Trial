import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolticalDebateComments } from './entities/poltical_debate_comments.entity';
import { PolticalDebateBoards } from './entities/poltical_debate.entity';
import { CreatePolticalDebateCommentDto } from './dto/create-poltical_debate_comment_dto';
import { UserInfos } from '../users/entities/user-info.entity';
import { RedisService } from '../cache/redis.service';
import { NicknameGeneratorService } from '../chats/nickname.service';

@Injectable()
export class PolticalDebateCommentsService {
  constructor(
    @InjectRepository(PolticalDebateComments)
    private readonly polticalDebateCommentsRepository: Repository<PolticalDebateComments>,
    @InjectRepository(PolticalDebateBoards)
    private readonly polticalDebateRepository: Repository<PolticalDebateBoards>,
    private readonly redisService: RedisService,
    private readonly nickNameService: NicknameGeneratorService,
  ) {}

  async createComment(
    userInfo: UserInfos,
    polticalDebateId: number,
    createPolticalDebateCommentDto: CreatePolticalDebateCommentDto,
  ) {
    const findPolticalDebateBoard = await this.polticalDebateRepository.findOne(
      {
        where: { id: polticalDebateId },
      },
    );

    if (!findPolticalDebateBoard)
      throw new NotFoundException(
        `${polticalDebateId}번 게시물을 찾을 수 없습니다.`,
      );

    const createdComment = await this.polticalDebateCommentsRepository.save({
      userId: userInfo.id,
      polticalDebateId,
      ...createPolticalDebateCommentDto,
    });

    return createdComment;
  }

  async getAllComments(polticalDebateId: number) {
    return await this.polticalDebateCommentsRepository.find({
      where: { polticalDebateBoard: { id: polticalDebateId } },
      order: { id: 'ASC' },
    });
  }

  async getCommentById(polticalDebateId: number, commentId: number) {
    return await this.polticalDebateCommentsRepository.findOne({
      where: { id: commentId, polticalDebateBoard: { id: polticalDebateId } },
    });
  }

  async updateComment(
    userInfo: UserInfos,
    polticalDebateId: number,
    commentId: number,
    updatePolticalDebateCommentDto: CreatePolticalDebateCommentDto,
  ) {
    const comment = await this.getCommentById(polticalDebateId, commentId);
    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.userId !== userInfo.id) {
      throw new UnauthorizedException('댓글을 수정할 권한이 없습니다.');
    }

    const updatedComment = await this.polticalDebateCommentsRepository.merge(
      comment,
      updatePolticalDebateCommentDto,
    );
    return await this.polticalDebateCommentsRepository.save(updatedComment);
  }

  async deleteComment(
    userInfo: UserInfos,
    polticalDebateId: number,
    commentId: number,
  ) {
    const comment = await this.getCommentById(polticalDebateId, commentId);
    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.userId !== userInfo.id) {
      throw new UnauthorizedException('댓글을 삭제할 권한이 없습니다.');
    }

    await this.polticalDebateCommentsRepository.delete(commentId);
    return { message: '댓글이 삭제되었습니다.' };
  }
}
