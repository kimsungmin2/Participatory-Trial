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
import { HumorCommentsService } from './humor-comments.service';
import { CreateHumorCommentDto } from './dto/create-humor-comment.dto';
import { UpdateHumorCommentDto } from './dto/update-humor-comment.dto';
import { HumorComments } from './entities/humor_comment.entity';
import { UserInfo } from '../utils/decorator/userInfo.decorator';
import { AuthGuard } from '@nestjs/passport';
import { Users } from '../users/entities/user.entity';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
@ApiTags('유머 게시판 댓글 API')
@Controller('humors/:boardId/comments')
export class HumorCommentsController {
  constructor(private readonly humorCommentsService: HumorCommentsService) {}

  //유머 댓글 생성
  @ApiOperation({ summary: '유머 게시물 댓글 생성' })
  @ApiBody({
    description: '유머 게시물 댓글 생성',
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', default: '댓글을 적으세여' },
      },
    },
  })
  @ApiParam({
    name: 'boardId',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createHumorComment(
    @Body() createHumorCommentDto: CreateHumorCommentDto,
    @Param('boardId') boardId: number,
    @UserInfo() user: Users,
  ) {
    const createdComment = await this.humorCommentsService.createComment(
      createHumorCommentDto,
      boardId,
      user,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: '댓글 생성에 성공하였습니다',
      data: createdComment,
    };
  }

  //댓글 모두 조회
  @ApiOperation({ summary: '유머 게시물 댓글 모두 조회' })
  @ApiParam({
    name: 'boardId',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  @Get()
  async findAllHumorComment(@Param('boardId') boardId: number) {
    const foundComments: HumorComments[] =
      await this.humorCommentsService.findAllComment(boardId);
    return {
      statusCode: HttpStatus.OK,
      message: '모든 댓글 조회에 성공하였습니다.',
      data: foundComments,
    };
  }

  //댓글 단건 조회
  @ApiOperation({ summary: '유머 게시물 댓글 단건 조회' })
  @ApiParam({
    name: 'boardId',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  @Get(':commentId')
  async findOneHumorComment(
    @Param('boardId') boardId: number,
    @Param('commentId') commentId: number,
  ) {
    const foundComment = await this.humorCommentsService.findOneComment(
      boardId,
      commentId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '댓글 조회에 성공하였습니다.',
      data: foundComment,
    };
  }

  //유머 댓글 수정
  @ApiBody({
    description: '유머 게시물 댓글 수정',
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', default: '댓글을 적으세여' },
      },
    },
  })
  @ApiOperation({ summary: '유머 게시물 댓글 수정' })
  @ApiParam({
    name: 'boardId',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  @Patch(':commentId')
  async updateHumorComment(
    @Param('boardId') boardId: number,
    @Param('commentId') commentId: number,
    @Body() updateHumorCommentDto: UpdateHumorCommentDto,
    @UserInfo() user: Users,
  ) {
    const updatedComment = await this.humorCommentsService.updateComment(
      boardId,
      commentId,
      updateHumorCommentDto,
      user,
    );
    return {
      statusCode: HttpStatus.OK,
      message: '성공적으로 댓글 수정을 완료하였습니다.',
      data: updatedComment,
    };
  }

  //유머 댓글 삭제
  @ApiOperation({ summary: '유머 게시물 댓글 삭제' })
  @ApiParam({
    name: 'boardId',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  @Delete(':commentId')
  async deleteHumorComment(
    @Param('commentId') commentId: number,
    @Param('boardId') boardId: number,
    @UserInfo() user: Users,
  ) {
    await this.humorCommentsService.deleteHumorComment(
      commentId,
      boardId,
      user,
    );
    return {
      statusCode: HttpStatus.OK,
      message: `${commentId}번 댓글을 성공적으로 삭제하였습니다.`,
    };
  }
}
