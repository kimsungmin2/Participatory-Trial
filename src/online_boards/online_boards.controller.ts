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
  Query,
  Render,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { OnlineBoardsService } from './online_boards.service';
import { CreateOnlineBoardDto } from './dto/create-online_board.dto';
import { UpdateOnlineBoardDto } from './dto/update-online_board.dto';
import { FindAllOnlineBoardDto } from './dto/findAll-online_board.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from '../utils/decorator/userInfo.decorator';
import { UserInfos } from '../users/entities/user-info.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { OnlineBoardHallOfFameService } from './online_boards.hollofFame.service';
import { PaginationQueryDto } from 'src/humors/dto/get-humorBoard.dto';
import { BoardType } from 'src/s3/board-type';
import { BoardOwnerGuard } from './guards/online_boards.guard';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('자유 게시판')
@UseGuards(AuthGuard('jwt'))
@Controller('online-boards')
export class OnlineBoardsController {
  constructor(
    private readonly onlineBoardsService: OnlineBoardsService,
    private readonly onlineBoardHallOfFameService: OnlineBoardHallOfFameService,
  ) {}
  @ApiOperation({ summary: '자유 게시판 생성 API' })
  @ApiBearerAuth('access-token')

  //글쓰기 페이지
  @UseGuards(AuthGuard('jwt'))
  @Get('create')
  @Render('create-post.ejs') // index.ejs 파일을 렌더링하여 응답
  async getCreatePostPage() {
    return { boardType: BoardType.OnlineBoard };
  }
  //게시글 생성
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '자유 게시판 게시물 생성' })
  @ApiBody({
    description: '자유 게시판 게시물 생성',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
      },
    },
  })
  @ApiBearerAuth('access-token')
  @Post()
  async create(
    @Body() createOnlineBoardDto: CreateOnlineBoardDto,
    @UserInfo() userInfo: UserInfos,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const board = await this.onlineBoardsService.createBoard(
      createOnlineBoardDto,
      userInfo,
      files,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '게시글을 생성했습니다.',
      data: board,
    };
  }
  //전체조회

  // 모든 자유 게시판 검색어 조회 API
  @ApiOperation({ summary: '모든 자유 게시판 검색어 조회 API' })
  @ApiBearerAuth('access-token')
  @ApiQuery({
    name: 'name',
    required: false,
    description: '키워드',
    type: String,
    example: '은가누',
  })
  @Get('')
  @Render('board.ejs')
  async paginateBoards(
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<HumorBoardReturnValue> {
    const { onlineBoards, totalItems } =
      await this.onlineBoardsService.getPaginateBoards(paginationQueryDto);
    const pageCount = Math.ceil(totalItems / paginationQueryDto.limit);
    return {
      statusCode: HttpStatus.FOUND,
      message: '게시글을 조회합니다.',
      data: onlineBoards,
      boardType: BoardType.OnlineBoard,
      pageCount,
      currentPage: paginationQueryDto.page,
    };
  }

  //검색 API
  @Get('search')
  async findAll(@Body() findAllOnlineBoardDto: FindAllOnlineBoardDto) {
    const boards = await this.onlineBoardsService.findAllBoard(
      findAllOnlineBoardDto.keyword,
    );

    return {
      statusCode: HttpStatus.FOUND,
      message: '게시글을 조회합니다.',
      data: boards,
    };
  }
  //단건조회

  // 특정 자유 게시판 id 조회 API
  @ApiOperation({ summary: '특정 게시물 조회 API' })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'id',
    required: true,
    description: ' 자유 게시판 ID',
    type: Number,
  })
  @Get(':id')
  @Render('post.ejs')
  async findOne(@Param('id') id: number) {
    const board =
      await this.onlineBoardsService.findOneOnlineBoardWithIncreaseView(id);
    return {
      statusCode: HttpStatus.OK,
      message: '게시글을 조회합니다.',
      data: board,
      boardType: BoardType.OnlineBoard,
    };
  }

  // 내 자유 게시물 수정 API
  @ApiOperation({ summary: '자유 게시물 수정 API' })
  @ApiBearerAuth('access-token')
  @ApiBody({
    description: '자유 게시물 수정',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
      },
    },
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: '자유 게시물 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'), BoardOwnerGuard)
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

  // 내 자유 게시물 삭제 API
  @ApiOperation({ summary: ' 내 자유 게시물 삭제 API' })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'id',
    required: true,
    description: ' 자유 게시물 게시물 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'), BoardOwnerGuard)
  @Delete(':id')
  async remove(@Param('id') id: number) {
    const board = await this.onlineBoardsService.removeBoard(id);

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
