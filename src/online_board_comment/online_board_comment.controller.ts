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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CommentOwnerGuard } from './guards/online_board_comment.guard';
import { BoardIdValidationPipe } from '../online_boards/pipes/exist-board.pipe';

@ApiTags('자유 게시판 댓글')
@UseGuards(AuthGuard('jwt'))
@Controller('online-boards/:onlineBoardId/comments')
export class OnlineBoardCommentController {
  constructor(
    private readonly onlineBoardCommentService: OnlineBoardCommentService,
  ) {}
  //댓글 생성
  @ApiOperation({ summary: '특정 게시물 조회 API' })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'onlineBoardId',
    required: true,
    description: ' 자유 게시판 ID',
    type: Number,
  })
  @Post()
  async create(
    @Param('onlineBoardId', BoardIdValidationPipe) onlineBoardId: number,
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
  async findAll(
    @Param('onlineBoardId', BoardIdValidationPipe) onlineBoardId: number,
  ) {
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

  // 특정 자유 게시판 id 조회 API
  @ApiOperation({ summary: '특정 게시물 조회 API' })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'id',
    required: true,
    description: ' 자유 게시판 ID',
    type: Number,
  })
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
