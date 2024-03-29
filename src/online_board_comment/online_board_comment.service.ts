import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateOnlineBoardCommentDto } from './dto/create-online_board_comment.dto';
import { UpdateOnlineBoardCommentDto } from './dto/update-online_board_comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OnlineBoardComments } from './entities/online_board_comment.entity';
import { OnlineBoardsService } from 'src/online_boards/online_boards.service';
import { UsersService } from 'src/users/users.service';
import { UserInfos } from 'src/users/entities/user-info.entity';
import { ParamOnlineBoardComment } from './dto/param-online_board_comment.dto';
import { Repository } from 'typeorm';

@Injectable()
export class OnlineBoardCommentService {
  constructor(
    @InjectRepository(OnlineBoardComments)
    private readonly onlineBoardCommentRepository: Repository<OnlineBoardComments>,
    private readonly onlineBoardsService: OnlineBoardsService,
    private readonly usersService: UsersService,
  ) {}

  // 자유게시판 댓글 생성
  async createComment(
    onlineBoardId: number,
    createOnlineBoardCommentDto: CreateOnlineBoardCommentDto,
    userInfo: UserInfos,
  ) {
    const foundUser = await this.usersService.findByUserId(userInfo.id);
    const { content } = createOnlineBoardCommentDto;
    const foundBoard =
      await this.onlineBoardsService.findBoardId(onlineBoardId);
    const board = await this.onlineBoardCommentRepository.save({
      onlineBoardId: foundBoard.id,
      userId: foundUser.id,
      content,
    });
    return board;
  }

  //자유게시판 댓글 목록 조회
  async findAllComments(onlineBoardId: number) {
    const foundBoard =
      await this.onlineBoardsService.findBoardId(onlineBoardId);

    const comments = await this.onlineBoardCommentRepository.findBy({
      onlineBoardId: foundBoard.id,
    });

    return comments;
  }

  // 자유게시판 수정
  async updateComment(
    paramOnlineBoardComment: ParamOnlineBoardComment,
    updateOnlineBoardCommentDto: UpdateOnlineBoardCommentDto,
    userInfo: UserInfos,
  ) {
    const { onlineBoardId, commentId } = paramOnlineBoardComment;
    await this.onlineBoardsService.findBoardId(onlineBoardId);
    const foundUser = await this.usersService.findByUserId(userInfo.id);
    const foundComment = await this.findCommentById(commentId);
    if (foundUser.id !== foundComment.userId) {
      throw new ForbiddenException('수정 권한이 없습니다.');
    }

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
  async removeComment(
    paramOnlineBoardComment: ParamOnlineBoardComment,
    userInfo: UserInfos,
  ) {
    const { onlineBoardId, commentId } = paramOnlineBoardComment;
    await this.onlineBoardsService.findBoardId(onlineBoardId);
    const foundUser = await this.usersService.findByUserId(userInfo.id);
    const foundComment = await this.findCommentById(commentId);
    if (foundUser.id !== foundComment.userId) {
      throw new ForbiddenException('수정 권한이 없습니다.');
    }

    const removeComment = await this.onlineBoardCommentRepository.softDelete({
      id: commentId,
    });

    return removeComment;
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
}
