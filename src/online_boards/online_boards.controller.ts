import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OnlineBoardsService } from './online_boards.service';
import { CreateOnlineBoardDto } from './dto/create-online_board.dto';
import { UpdateOnlineBoardDto } from './dto/update-online_board.dto';
import { FindAllOnlineBoardDto } from './dto/findAll-online_board.dto';

@Controller('online-boards')
export class OnlineBoardsController {
  constructor(private readonly onlineBoardsService: OnlineBoardsService) {}

  @Post()
  async create(@Body() createOnlineBoardDto: CreateOnlineBoardDto) {
    return await this.onlineBoardsService.createBoard(createOnlineBoardDto);
  }

  @Get()
  findAll(@Body() findAllOnlineBoardDto: FindAllOnlineBoardDto) {
    return this.onlineBoardsService.findAllBoard(findAllOnlineBoardDto);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.onlineBoardsService.findBoard(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updateOnlineBoardDto: UpdateOnlineBoardDto,
  ) {
    return this.onlineBoardsService.updateBoard(id, updateOnlineBoardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.onlineBoardsService.removeBoard(id);
  }
}
