import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePolticalDebateCommentDto } from 'src/poltical_debates/dto/create-poltical_debate_comment_dto';
import { PolticalDebateBoards } from 'src/poltical_debates/entities/poltical_debate.entity';
import { Repository } from 'typeorm';
import { PolticalDebateComments } from './entities/poltical_debate_comments.entity';

@Injectable()
export class PolticalDebateCommentsService {
  constructor(
    @InjectRepository(PolticalDebateComments)
    private readonly polticalDebateCommentsRepository: Repository<PolticalDebateComments>,
    @InjectRepository(PolticalDebateBoards)
    private readonly polticalDebateBoardsRepository: Repository<PolticalDebateBoards>,
  ) {}

  async create(
    polticalDebateId: number,
    createPolticalDebateCommentDto: CreatePolticalDebateCommentDto,
  ) {
    const polticalDebateBoard =
      await this.polticalDebateBoardsRepository.findOne({
        where: { id: polticalDebateId },
      });
    if (!polticalDebateBoard) {
      throw new NotFoundException('정치 토론 게시판을 찾을 수 없습니다');
    }

    const newComment = this.polticalDebateCommentsRepository.create({
      ...createPolticalDebateCommentDto,
      polticalDebateBoard,
    });

    return this.polticalDebateCommentsRepository.save(newComment);
  }

  async findAll(polticalDebateId: number) {
    return this.polticalDebateCommentsRepository.find({
      where: { polticalDebateId },
    });
  }

  async update(
    commentId: number,
    createPolticalDebateCommentDto: CreatePolticalDebateCommentDto,
  ) {
    const polticalDebateComment =
      await this.polticalDebateCommentsRepository.findOne({
        where: { id: commentId },
      });
    if (!polticalDebateComment) {
      throw new NotFoundException('정치 토론 게시판 댓글을 찾을 수 없습니다.');
    }

    return this.polticalDebateCommentsRepository.update(
      commentId,
      createPolticalDebateCommentDto,
    );
  }

  async remove(commentId: number) {
    const polticalDebateComment =
      await this.polticalDebateCommentsRepository.findOne({
        where: { id: commentId },
      });
    if (!polticalDebateComment) {
      throw new NotFoundException('정치 토론 게시판 댓글을 찾을 수 없습니다.');
    }

    return this.polticalDebateCommentsRepository.delete(commentId);
  }
}
