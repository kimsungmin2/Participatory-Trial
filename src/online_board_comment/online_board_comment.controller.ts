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
import { UserInfo } from 'src/utils/decorator/userInfo.decorator';
import { UserInfos } from 'src/users/entities/user-info.entity';
import { ParamOnlineBoardComment } from './dto/param-online_board_comment.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('comments/:onlineBoardId')
export class OnlineBoardCommentController {
  constructor(
    private readonly onlineBoardCommentService: OnlineBoardCommentService,
  ) {}

  @Post()
  async create(
    @Param() onlineBoardId: number,
    @Body() createOnlineBoardCommentDto: CreateOnlineBoardCommentDto,
    @UserInfo() userInfo: UserInfos,
  ) {
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
  async findAll(@Param() onlineBoardId: number) {
    const comments =
      await this.onlineBoardCommentService.findAllComments(onlineBoardId);

    return {
      statusCode: HttpStatus.OK,
      message: '게시판의 댓글을 조회합니다.',
      data: comments,
    };
  }

  @Patch(':commentId')
  async update(
    @Param() paramOnlineBoardComment: ParamOnlineBoardComment,
    @Body() updateOnlineBoardCommentDto: UpdateOnlineBoardCommentDto,
    @UserInfo() userInfo: UserInfos,
  ) {
    const comment = await this.onlineBoardCommentService.updateComment(
      paramOnlineBoardComment,
      updateOnlineBoardCommentDto,
      userInfo,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '댓글을 수정했습니다.',
      data: comment,
    };
  }

  @Delete(':commentId')
  async remove(
    @Param() paramOnlineBoardComment: ParamOnlineBoardComment,
    @UserInfo() userInfo: UserInfos,
  ) {
    this.onlineBoardCommentService.removeComment(
      paramOnlineBoardComment,
      userInfo,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '댓글을 삭제하였습니다.',
    };
  }
}
