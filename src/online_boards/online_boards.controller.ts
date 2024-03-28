import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OnlineBoardsService } from './online_boards.service';
import { CreateOnlineBoardDto } from './dto/create-online_board.dto';
import { UpdateOnlineBoardDto } from './dto/update-online_board.dto';

@Controller('online-boards')
export class OnlineBoardsController {
  constructor(private readonly onlineBoardsService: OnlineBoardsService) {}

  @Post()
  create(@Body() createOnlineBoardDto: CreateOnlineBoardDto) {
    return this.onlineBoardsService.create(createOnlineBoardDto);
  }

  @Get()
  findAll() {
    return this.onlineBoardsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.onlineBoardsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOnlineBoardDto: UpdateOnlineBoardDto) {
    return this.onlineBoardsService.update(+id, updateOnlineBoardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.onlineBoardsService.remove(+id);
  }
}
