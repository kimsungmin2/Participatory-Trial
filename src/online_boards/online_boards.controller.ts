import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { OnlineBoardsService } from './online_boards.service';
import { CreateOnlineBoardDto } from './dto/create-online_board.dto';
import { UpdateOnlineBoardDto } from './dto/update-online_board.dto';
import { FindAllOnlineBoardDto } from './dto/findAll-online_board.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from '../utils/decorator/userInfo.decorator';
import { UserInfos } from '../users/entities/user-info.entity';
import { BoardOwnerGuard } from './guards/online_boards.guard';

@UseGuards(AuthGuard('jwt'))
@Controller('online-boards')
export class OnlineBoardsController {
  constructor(private readonly onlineBoardsService: OnlineBoardsService) {}

  @Post()
  async create(
    @Body() createOnlineBoardDto: CreateOnlineBoardDto,
    @UserInfo() userInfo: UserInfos,
  ) {
    const board = await this.onlineBoardsService.createBoard(
      createOnlineBoardDto,
      userInfo,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '게시글을 생성했습니다.',
      data: board,
    };
  }

  @Get()
  async findAll(@Body() findAllOnlineBoardDto: FindAllOnlineBoardDto) {
    const boards = await this.onlineBoardsService.findAllBoard(
      findAllOnlineBoardDto,
    );

    return {
      statusCode: HttpStatus.FOUND,
      message: '게시글을 조회합니다.',
      data: boards,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    const board = await this.onlineBoardsService.findBoard(id);

    return {
      statusCode: HttpStatus.OK,
      message: '게시글을 조회합니다.',
      data: board,
    };
  }

  @UseGuards(BoardOwnerGuard)
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateOnlineBoardDto: UpdateOnlineBoardDto,
  ) {
    const board = await this.onlineBoardsService.updateBoard(
      id,
      updateOnlineBoardDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '게시글을 수정했습니다.',
      data: board,
    };
  }

  @UseGuards(BoardOwnerGuard)
  @Delete(':id')
  async remove(@Param('id') id: number) {
    const board = await this.onlineBoardsService.removeBoard(id);

    return {
      statusCode: HttpStatus.OK,
      message: '게시글을 삭제했습니다.',
      data: board,
    };
  }
}
