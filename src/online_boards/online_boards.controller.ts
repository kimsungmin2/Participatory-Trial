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
import { ApiOperation } from '@nestjs/swagger';
import { OnlineBoardHallOfFameService } from './online_boards.hollofFame.service';

@UseGuards(AuthGuard('jwt'))
@Controller('online-boards')
export class OnlineBoardsController {
  constructor(
    private readonly onlineBoardsService: OnlineBoardsService,
    private readonly onlineBoardHallOfFameService: OnlineBoardHallOfFameService
    ) {}

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

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateOnlineBoardDto: UpdateOnlineBoardDto,
    @UserInfo() userInfo: UserInfos,
  ) {
    const board = await this.onlineBoardsService.updateBoard(
      id,
      updateOnlineBoardDto,
      userInfo,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '게시글을 수정했습니다.',
      data: board,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @UserInfo() userInfo: UserInfos) {
    const board = await this.onlineBoardsService.removeBoard(id, userInfo);

    return {
      statusCode: HttpStatus.OK,
      message: '게시글을 삭제했습니다.',
      data: board,
    };
  }

  // 자유 게시판 명예의 전당 조회하기 API(종아요 수)
  @ApiOperation({ summary: '자유 게시판 명예의 전당 조회하기 API(종아요 수)' })
  @Get('HallofFame/likes')
  async getRecentLikeHallOfFame() {
    const recentHallofFame =
      await this.onlineBoardHallOfFameService.getLikeRecentHallOfFame();
    if (!recentHallofFame) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: '자유 게시판 명예의 전당 정보가 없습니다.',
      };
    }
    return {
      statusCode: HttpStatus.OK,
      message: '자유 게시판 명예의 전당을 조회하였습니다.(좋아요 순)',
      recentHallofFame,
    };
  }

  // 자유 게시판 명예의 전당 조회하기 API(조회수 수)
  @ApiOperation({ summary: '자유 게시판 명예의 전당 조회하기 API(조회수 수)' })
  @Get('HallofFame/views')
  async getRecentViewHallOfFame() {
    const recentHallofFame =
      await this.onlineBoardHallOfFameService.getViewRecentHallOfFame();
    if (!recentHallofFame) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: '자유 게시판 명예의 전당 정보가 없습니다.',
      };
    }
    return {
      statusCode: HttpStatus.OK,
      message: '자유 게시판 명예의 전당을 조회하였습니다.(조회수 순)',
      recentHallofFame,
    };
  }
}
