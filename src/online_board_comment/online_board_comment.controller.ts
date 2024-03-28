import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
    return await this.onlineBoardCommentService.createComment(
      onlineBoardId,
      createOnlineBoardCommentDto,
    );
  }

  @Get(':onlineBoardId')
  async findAll(@Param() onlineBoardId: number) {
    return await this.onlineBoardCommentService.findAllComments(onlineBoardId);
  }

  @Patch(':commentId')
  async update(
    @Param() commentId: number,
    @Body() updateOnlineBoardCommentDto: UpdateOnlineBoardCommentDto,
  ) {
    return await this.onlineBoardCommentService.updateComment(
      commentId,
      updateOnlineBoardCommentDto,
    );
  }

  @Delete(':commentId')
  async remove(@Param() commentId: number) {
    return this.onlineBoardCommentService.removeComment(commentId);
  }
}
