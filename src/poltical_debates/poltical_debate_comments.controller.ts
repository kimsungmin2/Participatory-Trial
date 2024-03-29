// poltical_debate_comments.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Patch,
  Delete,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreatePolticalDebateCommentDto } from 'src/poltical_debates/dto/create-poltical_debate_comment_dto';
import { PolticalDebateCommentsService } from './poltical_debate_comments.service';

@ApiTags('정치 토론 댓글')
@Controller('poltical-debate/:polticalDebateId/comments')
export class PolticalDebateCommentsController {
  constructor(
    private readonly polticalDebateCommentsService: PolticalDebateCommentsService,
  ) {}

  @Post()
  async create(
    @Param('polticalDebateId') polticalDebateId: string,
    @Body() createPolticalDebateCommentDto: CreatePolticalDebateCommentDto,
  ) {
    try {
      const data = this.polticalDebateCommentsService.create(
        +polticalDebateId,
        createPolticalDebateCommentDto,
      );
      return {
        statusCode: HttpStatus.CREATED,
        message: '댓글생성에 성공했습니다.',
        data,
      };
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get()
  async findAll(@Param('polticalDebateId') polticalDebateId: string) {
    try {
      const data =
        this.polticalDebateCommentsService.findAll(+polticalDebateId);
      return {
        statusCode: HttpStatus.OK,
        message: '댓글조회에 성공했습니다.',
        data,
      };
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Patch(':commentId')
  update(
    @Param('commentId') commentId: string,
    @Body() createPolticalDebateCommentDto: CreatePolticalDebateCommentDto,
  ) {
    const data = this.polticalDebateCommentsService.update(
      +commentId,
      createPolticalDebateCommentDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: '댓글수정에 성공했습니다.',
      data,
    };
  }

  @Delete(':commentId')
  async remove(@Param('commentId') commentId: string) {
    try {
      const data = await this.polticalDebateCommentsService.remove(+commentId);
      return {
        statusCode: HttpStatus.OK,
        message: '댓글삭제에 성공했습니다.',
        data,
      };
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
}
