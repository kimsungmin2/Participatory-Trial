import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UserInfos } from '../users/entities/user-info.entity';
import { UserInfo } from '../utils/decorator/userInfo.decorator';
import { CreatePolticalDebateCommentDto } from './dto/create-poltical_debate_comment_dto';
import { PolticalDebateCommentsService } from './poltical_debate_comments.service';

@ApiTags('정치 토론 댓글')
@Controller('poltical-debates/:polticalDebateId/comments')
export class PolticalDebateCommentsController {
  constructor(
    private readonly polticalDebateCommentsService: PolticalDebateCommentsService,
  ) {}

  @ApiOperation({ summary: '정치 토론 댓글 생성', description: '생성' })
  @ApiParam({
    name: 'polticalDebateId',
    required: true,
    description: ' 정치 토론 게시판 ID',
    type: Number,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createComment(
    @UserInfo() userInfo: UserInfos,
    @Param('polticalDebateId') polticalDebateId: number,
    @Body() createPolticalDebateCommentDto: CreatePolticalDebateCommentDto,
  ) {
    const data = await this.polticalDebateCommentsService.createComment(
      userInfo,
      polticalDebateId,
      createPolticalDebateCommentDto,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '댓글 생성에 성공했습니다.',
      data,
    };
  }

  @ApiOperation({ summary: '정치 토론 댓글 조회', description: '조회' })
  @ApiParam({
    name: 'polticalDebateId',
    required: true,
    description: ' 정치 토론 게시판 ID',
    type: Number,
  })
  @Get()
  async getAllComments(@Param('polticalDebateId') polticalDebateId: number) {
    return await this.polticalDebateCommentsService.getAllComments(
      polticalDebateId,
    );
  }

  @ApiOperation({
    summary: '정치 토론 댓글 상세 조회',
    description: '상세 조회',
  })
  @ApiParam({
    name: 'polticalDebateId',
    required: true,
    description: ' 정치 토론 게시판 ID',
    type: Number,
  })
  @ApiParam({
    name: 'commentId',
    required: true,
    description: ' 정치 토론 게시판 댓글 ID',
    type: Number,
  })
  @Get(':commentId')
  async getCommentById(
    @Param('polticalDebateId') polticalDebateId: number,
    @Param('commentId') commentId: number,
  ) {
    const comment = await this.polticalDebateCommentsService.getCommentById(
      polticalDebateId,
      commentId,
    );
    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }
    return comment;
  }

  @ApiOperation({ summary: '정치 토론 댓글 수정', description: '수정' })
  @ApiParam({
    name: 'polticalDebateId',
    required: true,
    description: ' 정치 토론 게시판 ID',
    type: Number,
  })
  @ApiParam({
    name: 'commentId',
    required: true,
    description: ' 정치 토론 게시판 댓글 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  @Put(':commentId')
  async updateComment(
    @UserInfo() userInfo: UserInfos,
    @Param('polticalDebateId') polticalDebateId: number,
    @Param('commentId') commentId: number,
    @Body() updatePolticalDebateCommentDto: CreatePolticalDebateCommentDto,
  ) {
    return await this.polticalDebateCommentsService.updateComment(
      userInfo,
      polticalDebateId,
      commentId,
      updatePolticalDebateCommentDto,
    );
  }

  @ApiOperation({ summary: '정치 토론 댓글 삭제', description: '삭제' })
  @ApiParam({
    name: 'polticalDebateId',
    required: true,
    description: ' 정치 토론 게시판 ID',
    type: Number,
  })
  @ApiParam({
    name: 'commentId',
    required: true,
    description: ' 정치 토론 게시판 댓글 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  @Delete(':commentId')
  async deleteComment(
    @UserInfo() userInfo: UserInfos,
    @Param('polticalDebateId') polticalDebateId: number,
    @Param('commentId') commentId: number,
  ) {
    return await this.polticalDebateCommentsService.deleteComment(
      userInfo,
      polticalDebateId,
      commentId,
    );
  }
}
