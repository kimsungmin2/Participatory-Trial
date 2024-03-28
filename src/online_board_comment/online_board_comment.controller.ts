import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OnlineBoardCommentService } from './online_board_comment.service';
import { CreateOnlineBoardCommentDto } from './dto/create-online_board_comment.dto';
import { UpdateOnlineBoardCommentDto } from './dto/update-online_board_comment.dto';

@Controller('online-board-comment')
export class OnlineBoardCommentController {
  constructor(private readonly onlineBoardCommentService: OnlineBoardCommentService) {}

  @Post()
  create(@Body() createOnlineBoardCommentDto: CreateOnlineBoardCommentDto) {
    return this.onlineBoardCommentService.create(createOnlineBoardCommentDto);
  }

  @Get()
  findAll() {
    return this.onlineBoardCommentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.onlineBoardCommentService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOnlineBoardCommentDto: UpdateOnlineBoardCommentDto) {
    return this.onlineBoardCommentService.update(+id, updateOnlineBoardCommentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.onlineBoardCommentService.remove(+id);
  }
}
