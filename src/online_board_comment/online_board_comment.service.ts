import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOnlineBoardCommentDto } from './dto/create-online_board_comment.dto';
import { UpdateOnlineBoardCommentDto } from './dto/update-online_board_comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OnlineBoardComments } from './entities/online_board_comment.entity';
import { Repository } from 'typeorm';
import { OnlineBoards } from 'src/online_boards/entities/online_board.entity';

@Injectable()
export class OnlineBoardCommentService {
  constructor(
    @InjectRepository(OnlineBoardComments)
    private readonly onlineBoardCommentRepository: Repository<OnlineBoardComments>,
    @InjectRepository(OnlineBoards)
    private readonly onlineBoardRepository: Repository<OnlineBoards>,
  ) {}
  // 자유게시판 아이디 검색
  async existingOnlineBoard(onlineBoardId: number) {
    const board = await this.onlineBoardRepository.findOneBy({
      id: onlineBoardId,
    });
    if (!board) {
      throw new NotFoundException('해당 게시판이 존재하지 않습니다.');
    }
    return board;
  }

  // 자유게시판 생성
  async createComment(
    onlineBoardId: number,
    createOnlineBoardCommentDto: CreateOnlineBoardCommentDto,
  ) {
    const { content } = createOnlineBoardCommentDto;
    const findBoard = await this.existingOnlineBoard(onlineBoardId);
    const board = await this.onlineBoardCommentRepository.save({
      onlineBoardId: findBoard.id,
      content,
    });
    return board;
  }

  //자유게시판 목록 조회
  async findAllComments(onlineBoardId: number) {
    const findBoard = await this.existingOnlineBoard(onlineBoardId);
    const comments = await this.onlineBoardCommentRepository.findBy({
      onlineBoardId: findBoard.id,
    });
    return comments;
  }

  // 자유게시판 수정
  async updateComment(
    commentId: number,
    updateOnlineBoardCommentDto: UpdateOnlineBoardCommentDto,
  ) {
    const { content } = updateOnlineBoardCommentDto;
    const comment = await this.onlineBoardCommentRepository.update(
      { id: commentId },
      {
        content,
      },
    );
    return comment;
  }

  // 자유게시판 삭제
  async removeComment(commentId: number) {
    const removeComment = await this.onlineBoardCommentRepository.softDelete({
      id: commentId,
    });
    return removeComment;
  }
}
