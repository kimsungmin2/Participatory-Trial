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
import { HumorCommentsService } from './humor-comments.service';
import { CreateHumorCommentDto } from './dto/create-humor-comment.dto';
import { UpdateHumorCommentDto } from './dto/update-humor-comment.dto';

@Controller('humor-board/:board-id/comments')
export class HumorCommentsController {
  constructor(private readonly humorCommentsService: HumorCommentsService) {}

  @Post()
  async createHumorComment(
    @Body() createHumorCommentDto: CreateHumorCommentDto,
    @Param('board-id') boardId: number,
  ): Promise<HumorBoardReturnValue> {
    const createdComment = await this.humorCommentsService.createComment(
      createHumorCommentDto,
      boardId,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: '댓글 생성에 성공하였습니다',
      data: createdComment,
    };
  }

  @Get()
  async findAllHumorComment() {
    return this.humorCommentsService.findAll();
  }

  @Get(':id')
  async findOneHumorComment(@Param('id') id: number) {
    return this.humorCommentsService.findOne(id);
  }

  @Patch(':id')
  async updateHumorComment(
    @Param('id') id: number,
    @Body() updateHumorCommentDto: UpdateHumorCommentDto,
  ) {
    return this.humorCommentsService.update(+id, updateHumorCommentDto);
  }

  @Delete(':id')
  deleteHumorComment(@Param('id') id: number) {
    return this.humorCommentsService.remove(+id);
  }
}
