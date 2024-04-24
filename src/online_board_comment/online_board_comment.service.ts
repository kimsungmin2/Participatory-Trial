import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOnlineBoardCommentDto } from './dto/create-online_board_comment.dto';
import { UpdateOnlineBoardCommentDto } from './dto/update-online_board_comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OnlineBoardComments } from './entities/online_board_comment.entity';
import { OnlineBoardsService } from '../online_boards/online_boards.service';
import { UsersService } from '../users/users.service';
import { UserInfos } from '../users/entities/user-info.entity';
import { Repository } from 'typeorm';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';

@Injectable()
export class OnlineBoardCommentService {
  constructor(
    @InjectRepository(OnlineBoardComments)
    private readonly onlineBoardCommentRepository: Repository<OnlineBoardComments>,
    @InjectRepository(OnlineBoards)
    private readonly onlineBoardRepository: Repository<OnlineBoards>,

    private readonly onlineBoardsService: OnlineBoardsService,
  ) {}

  // 자유게시판 댓글 생성
  async createComment(
    onlineBoardId: number,
    createOnlineBoardCommentDto: CreateOnlineBoardCommentDto,
    userInfo: UserInfos,
  ) {
    console.log(userInfo.id);
    const { content } = createOnlineBoardCommentDto;
    const foundBoard =
      await this.onlineBoardsService.findBoardId(onlineBoardId);
    console.log(foundBoard);
    const board = await this.onlineBoardCommentRepository.save({
      onlineBoardId: foundBoard.id,
      userId: userInfo.id,
      content,
    });

    return board;
  }

  //자유게시판 댓글 목록 조회
  async findAllComments(onlineBoardId: number) {
    const comments = await this.onlineBoardCommentRepository.findBy({
      onlineBoardId,
    });

    return comments;
  }

  // 자유게시판 수정
  async updateComment(
    onlineBoardId: number,
    commentId: number,
    updateOnlineBoardCommentDto: UpdateOnlineBoardCommentDto,
  ) {
    const foundComment = await this.findCommentById(commentId);
    const comment = await this.onlineBoardCommentRepository.update(
      { id: foundComment.id, onlineBoardId },
      {
        content: updateOnlineBoardCommentDto.content,
      },
    );

    return comment;
  }

  // 자유게시판 삭제
  async removeComment(onlineBoardId: number, commentId: number) {
    const foundComment = await this.findCommentById(commentId);

    await this.onlineBoardCommentRepository.softDelete({
      id: foundComment.id,
      onlineBoardId,
    });

    return `This action removes a #${commentId} onlineBoard`;
  }

  // 댓글의 유저 조회
  async findCommentById(commentId: number) {
    const foundComment = await this.onlineBoardCommentRepository.findOneBy({
      id: commentId,
    });

    if (!foundComment) {
      throw new NotFoundException('해당 댓글을 조회할 수 없습니다.');
    }

    return foundComment;
  }

  async verifyCommentOwner(userId: number, commentId: number) {
    const foundCommentOwner = await this.onlineBoardCommentRepository.findOne({
      where: { userId, id: commentId },
    });

    if (!foundCommentOwner) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    return foundCommentOwner;
  }
}
