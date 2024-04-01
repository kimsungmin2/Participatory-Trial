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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePolticalDebateCommentDto } from 'src/poltical_debates/dto/create-poltical_debate_comment_dto';
import { Users } from 'src/users/entities/user.entity';
import { UserInfo } from 'src/utils/decorator/userInfo.decorator';
import { PolticalDebateCommentsService } from './poltical_debate_comments.service';

@ApiTags('정치 토론 댓글')
@Controller('polticalDebates/:polticalDebateId/comments')
export class PolticalDebateCommentsController {
  constructor(
    private readonly polticalDebateCommentsService: PolticalDebateCommentsService,
  ) {}

  @ApiOperation({ summary: '정치 토론 댓글 생성', description: '생성' })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createComment(
    @UserInfo() user: Users,
    @Param('polticalDebateId') polticalDebateId: number,
    @Body() createPolticalDebateCommentDto: CreatePolticalDebateCommentDto,
  ) {
    const data = await this.polticalDebateCommentsService.createComment(
      user,
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
  @UseGuards(AuthGuard('jwt'))
  @Put(':commentId')
  async updateComment(
    @UserInfo() userInfo: Users,
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
  @UseGuards(AuthGuard('jwt'))
  @Delete(':commentId')
  async deleteComment(
    @UserInfo() userInfo: Users,
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
