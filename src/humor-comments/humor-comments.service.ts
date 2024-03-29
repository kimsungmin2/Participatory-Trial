import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateHumorCommentDto } from './dto/create-humor-comment.dto';
import { UpdateHumorCommentDto } from './dto/update-humor-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { HumorComments } from './entities/humor_comment.entity';
import { DeleteResult, Repository } from 'typeorm';
import { HumorBoards } from '../humors/entities/humor-board.entity';
import { Users } from '../users/entities/user.entity';
import { forbidden } from 'joi';

@Injectable()
export class HumorCommentsService {
  constructor(
    @InjectRepository(HumorComments)
    private humorCommentRepository: Repository<HumorComments>,
    @InjectRepository(HumorBoards)
    private humorBoardRepository: Repository<HumorBoards>,
  ) {}
  //댓글 생성
  async createComment(
    createHumorCommentDto: CreateHumorCommentDto,
    boardId: number,
    user: Users,
  ): Promise<HumorComments> {
    const findHumorBoard: HumorBoards =
      await this.humorBoardRepository.findOneBy({
        id: boardId,
      });
    if (!findHumorBoard)
      throw new NotFoundException(`${boardId}번 게시물을 찾을 수 없습니다.`);

    const createdComment: HumorComments =
      await this.humorCommentRepository.save({
        humorBoardId: boardId,
        userId: user.id,
        ...createHumorCommentDto,
      });

    return createdComment;
  }
  //모든 댓글 조회
  async findAllComment(boardId: number): Promise<HumorComments[]> {
    const findHumorBoard = await this.humorBoardRepository.findOneBy({
      id: boardId,
    });
    if (!findHumorBoard)
      throw new NotFoundException(`${boardId}번 게시물을 찾을 수 없습니다.`);
    return await this.humorCommentRepository.find({
      where: { humorBoardId: boardId },
    });
  }
  //특정 댓글 조회
  async findOneComment(
    boardId: number,
    commentId: number,
  ): Promise<HumorComments> {
    const findHumorBoard = await this.humorBoardRepository.findOneBy({
      id: boardId,
    });
    if (!findHumorBoard)
      throw new NotFoundException(`${boardId}번 게시물을 찾을 수 없습니다.`);
    const findComment = await this.humorCommentRepository.findOne({
      where: { humorBoardId: boardId, id: commentId },
    });
    if (!findComment) {
      throw new NotFoundException(`${commentId}번 댓글을 찾을 수 없습니다.`);
    }
    return findComment;
  }

  async updateComment(
    boardId: number,
    commentId: number,
    updateHumorCommentDto: UpdateHumorCommentDto,
    user: Users,
  ): Promise<HumorComments> {
    const userId = user.id;
    const findHumorBoard = await this.humorBoardRepository.findOneBy({
      id: boardId,
    });
    if (!findHumorBoard)
      throw new NotFoundException(`${boardId}번 게시물을 찾을 수 없습니다.`);
    const findComment = await this.humorCommentRepository.findOne({
      where: { humorBoardId: boardId, id: commentId },
    });
    if (!findComment) {
      throw new NotFoundException(`${commentId}번 댓글을 찾을 수 없습니다.`);
    }
    if (findComment.userId !== userId) {
      throw new ForbiddenException('해당 댓글을 수정할 권한이 없습니다.');
    }
    const updatedComment = this.humorCommentRepository.merge(
      findComment,
      updateHumorCommentDto,
    );
    try {
      await this.humorCommentRepository.save(updatedComment);
    } catch {
      throw new InternalServerErrorException(
        '업데이트 도중 예기치 못한 오류가 발생했습니다. 다시 시도해주세요.',
      );
    }
    return updatedComment;
  }

  async deleteHumorComment(
    commentId: number,
    boardId: number,
    user: Users,
  ): Promise<DeleteResult> {
    const userId = user.id;
    const findHumorBoard = await this.humorBoardRepository.findOneBy({
      id: boardId,
    });
    if (!findHumorBoard)
      throw new NotFoundException(`${boardId}번 게시물을 찾을 수 없습니다.`);
    const findComment = await this.humorCommentRepository.findOne({
      where: { humorBoardId: boardId, id: commentId },
    });
    if (!findComment) {
      throw new NotFoundException(`${commentId}번 댓글을 찾을 수 없습니다.`);
    }
    if (findComment.userId !== userId) {
      throw new ForbiddenException('해당 댓글을 삭제할 권한이 없습니다.');
    }
    const deletedComment = await this.humorCommentRepository.delete(commentId);
    if (deletedComment.affected !== 1) {
      throw new InternalServerErrorException(
        '댓글 삭제 중 예기치 못한 오류가 발생하였습니다. 다시 시도해주세요.',
      );
    }
    return deletedComment;
  }
}
