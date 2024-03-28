import { Injectable } from '@nestjs/common';
import { CreateOnlineBoardCommentDto } from './dto/create-online_board_comment.dto';
import { UpdateOnlineBoardCommentDto } from './dto/update-online_board_comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OnlineBoardComments } from './entities/online_board_comment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OnlineBoardCommentService {
  constructor(
    @InjectRepository(OnlineBoardComments)
    private readonly onlineBoardCommentRepository: Repository<OnlineBoardComments>,
  ) {}
  async createComment(
    onlineBoardId: number,
    createOnlineBoardCommentDto: CreateOnlineBoardCommentDto,
  ) {
    const { content } = createOnlineBoardCommentDto;
    const board = await this.onlineBoardCommentRepository.save({
      onlineBoardId,
      content,
    });
    return board;
  }

  async findAllComments(onlineBoardId: number) {
    const comments = await this.onlineBoardCommentRepository.findBy({
      onlineBoardId,
    });
    return comments;
  }

  async updateComment(
    commentId: number,
    updateOnlineBoardCommentDto: UpdateOnlineBoardCommentDto,
  ) {
    const { content } = updateOnlineBoardCommentDto;
    const comment = await this.onlineBoardCommentRepository.save({
      id: commentId,
      content,
    });
    return comment;
  }

  async removeComment(commentId: number) {
    const removeComment = await this.onlineBoardCommentRepository.softDelete({
      id: commentId,
    });
    return removeComment;
  }
}
