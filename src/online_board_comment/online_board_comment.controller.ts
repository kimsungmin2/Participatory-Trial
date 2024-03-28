import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import { OnlineBoardCommentService } from './online_board_comment.service';
import { CreateOnlineBoardCommentDto } from './dto/create-online_board_comment.dto';
import { UpdateOnlineBoardCommentDto } from './dto/update-online_board_comment.dto';

@Controller('comments')
export class OnlineBoardCommentController {
  constructor(
    private readonly onlineBoardCommentService: OnlineBoardCommentService,
  ) {}

  @Post(':onlineBoardId')
  async create(
    @Param() onlineBoardId: number,
    @Body() createOnlineBoardCommentDto: CreateOnlineBoardCommentDto,
  ) {
    const comment = await this.onlineBoardCommentService.createComment(
      onlineBoardId,
      createOnlineBoardCommentDto,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '댓글을 생성했습니다.',
      data: comment,
    };
  }

  @Get(':onlineBoardId')
  async findAll(@Param() onlineBoardId: number) {
    const comments =
      await this.onlineBoardCommentService.findAllComments(onlineBoardId);

    return {
      statusCode: HttpStatus.CREATED,
      message: '게시판의 댓글을 조회합니다.',
      data: comments,
    };
  }

  @Patch(':commentId')
  async update(
    @Param() commentId: number,
    @Body() updateOnlineBoardCommentDto: UpdateOnlineBoardCommentDto,
  ) {
    const comment = await this.onlineBoardCommentService.updateComment(
      commentId,
      updateOnlineBoardCommentDto,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '댓글을 수정했습니다.',
      data: comment,
    };
  }

  @Delete(':commentId')
  async remove(@Param() commentId: number) {
    this.onlineBoardCommentService.removeComment(commentId);

    return {
      statusCode: HttpStatus.CREATED,
      message: '댓글을 삭제하였습니다.',
    };
  }
}
