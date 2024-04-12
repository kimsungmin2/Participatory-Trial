import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OnlineBoardCommentService } from './online_board_comment.service';
import { CreateOnlineBoardCommentDto } from './dto/create-online_board_comment.dto';
import { UpdateOnlineBoardCommentDto } from './dto/update-online_board_comment.dto';
import { UserInfo } from '../utils/decorator/userInfo.decorator';
import { UserInfos } from '../users/entities/user-info.entity';
import { ParamOnlineBoardComment } from './dto/param-online_board_comment.dto';
import { ApiTags } from '@nestjs/swagger';
import { CommentOwnerGuard } from './guards/online_board_comment.guard';

@ApiTags('자유 게시판 댓글')
@UseGuards(AuthGuard('jwt'))
@Controller('online-boards/:onlineBoardId/comments')
export class OnlineBoardCommentController {
  constructor(
    private readonly onlineBoardCommentService: OnlineBoardCommentService,
  ) {}

  @Post()
  async create(
    @Param('onlineBoardId') onlineBoardId: number,
    @Body() createOnlineBoardCommentDto: CreateOnlineBoardCommentDto,
    @UserInfo() userInfo: UserInfos,
  ) {
    console.log(userInfo);
    const comment = await this.onlineBoardCommentService.createComment(
      onlineBoardId,
      createOnlineBoardCommentDto,
      userInfo,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '댓글을 생성했습니다.',
      data: comment,
    };
  }

  @Get()
  async findAll(@Param('onlineBoardId') onlineBoardId: number) {
    const comments =
      await this.onlineBoardCommentService.findAllComments(onlineBoardId);

    return {
      statusCode: HttpStatus.OK,
      message: '게시판의 댓글을 조회합니다.',
      data: comments,
    };
  }

  @UseGuards(CommentOwnerGuard)
  @Patch(':commentId')
  async update(
    @Param('onlineBoardId') onlineBoardId: number,
    @Param('commentId') commentId: number,
    @Body() updateOnlineBoardCommentDto: UpdateOnlineBoardCommentDto,
  ) {
    const comment = await this.onlineBoardCommentService.updateComment(
      onlineBoardId,
      commentId,
      updateOnlineBoardCommentDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '댓글을 수정했습니다.',
      data: comment,
    };
  }

  @UseGuards(CommentOwnerGuard)
  @Delete(':commentId')
  async remove(
    @Param('onlineBoardId') onlineBoardId: number,
    @Param('commentId') commentId: number,
  ) {
    this.onlineBoardCommentService.removeComment(onlineBoardId, commentId);

    return {
      statusCode: HttpStatus.OK,
      message: '댓글을 삭제하였습니다.',
    };
  }
}
