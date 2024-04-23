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
  Req,
} from '@nestjs/common';
import { OnlineBoardsService } from './online_boards.service';
import { CreateOnlineBoardDto } from './dto/create-online_board.dto';
import { UpdateOnlineBoardDto } from './dto/update-online_board.dto';
import { FindAllOnlineBoardDto } from './dto/findAll-online_board.dto';
import { AuthGuard } from '@nestjs/passport';
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
import { BoardOwnerGuard } from './guards/online_boards.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { start } from 'repl';
import { BoardType } from '../s3/board-type';
import { PaginationQueryDto } from '../humors/dto/get-humorBoard.dto';
import { HalloffameType } from '../s3/halloffame-type';
import { PaginationQueryHallOfFameDto } from '../humors/dto/get-pagenation.dto';
import { UserInfo } from '../utils/decorator/userInfo.decorator';

@ApiTags('자유 게시판')
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
  async getCreatePostPage(@Req() req: Request) {
    return { boardType: BoardType.OnlineBoard, isLoggedIn: req['isLoggedIn'] };
  }

  @ApiOperation({ summary: '유머 게시판 게시물 수정 페이지' })
  @Get('update/:id')
  @UseGuards(AuthGuard('jwt'), BoardOwnerGuard)
  @Render('update-post.ejs') // index.ejs 파일을 렌더링하여 응답
  async getUpdatePostPage(@Req() req: Request, @Param('id') id: number) {
    const data = await this.onlineBoardsService.findBoardId(id);
    return {
      boardType: BoardType.OnlineBoard,
      isLoggedIn: req['isLoggedIn'],
      data,
    };
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
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Body() createOnlineBoardDto: CreateOnlineBoardDto,
    @UserInfo() userInfo: UserInfos,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    console.log(1, files);
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
    @Req() req: Request,
  ) {
    const { onlineBoards, totalItems } =
      await this.onlineBoardsService.getPaginateBoards(paginationQueryDto);
    const pageCount = Math.ceil(totalItems / paginationQueryDto.limit);
    const currentPage = paginationQueryDto.page;
    const startPage = Math.floor((currentPage - 1) / 10) * 10 + 1;
    let endPage = startPage + 9;
    if (endPage > pageCount) {
      endPage = pageCount;
    }
    return {
      statusCode: HttpStatus.FOUND,
      message: '게시글을 조회합니다.',
      data: onlineBoards,
      boardType: BoardType.OnlineBoard,
      pageCount,
      currentPage,
      startPage,
      endPage,
      isLoggedIn: req['isLoggedIn'],
    };
  }

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
  async findOne(@Param('id') id: number, @Req() req: Request) {
    const board =
      await this.onlineBoardsService.findOneOnlineBoardWithIncreaseView(id);
    return {
      statusCode: HttpStatus.OK,
      message: '게시글을 조회합니다.',
      data: board,
      boardType: BoardType.OnlineBoard,
      isLoggedIn: req['isLoggedIn'],
    };
  }

  // 내 자유 게시물 수정 API
  @ApiConsumes()
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
    console.log(updateOnlineBoardDto);
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
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '한 페이지당 게시물 수',
    type: Number,
    example: 10,
  })
  @Get('HallofFame/likes')
  @Render('halloffame.ejs') // index.ejs 파일을 렌더링하여 응답
  async getRecentLikeHallOfFame(
    @Query() paginationQueryDto: PaginationQueryHallOfFameDto,
    @Req() req: Request,
  ) {
    const { onlineBoardLikeHallOfFames, totalItems } =
      await this.onlineBoardHallOfFameService.getLikeRecentHallOfFame(
        paginationQueryDto,
      );
    const pageCount = Math.ceil(totalItems / paginationQueryDto.limit);
    const currentPage = paginationQueryDto.page;
    const startPage = Math.floor((currentPage - 1) / 100) * 100 + 1;
    let endPage = startPage + 9;
    if (endPage > pageCount) {
      endPage = pageCount;
    }
    return {
      statusCode: HttpStatus.OK,
      message: '자유 게시판 명예의 전당을 조회하였습니다.(좋아요 순)',
      data: onlineBoardLikeHallOfFames,
      pageCount,
      currentPage,
      startPage,
      endPage,
      isLoggedIn: req['isLoggedIn'],
      halloffameType: HalloffameType.OnlineBoardHallofFameLikes,
    };
  }

  // 자유 게시판 명예의 전당 조회하기 API(조회수 수)
  @ApiOperation({ summary: '자유 게시판 명예의 전당 조회하기 API(조회수 수)' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '한 페이지당 게시물 수',
    type: Number,
    example: 10,
  })
  @Get('HallofFame/views')
  @Render('halloffame.ejs') // index.ejs 파일을 렌더링하여 응답
  async getRecentViewHallOfFame(
    @Query() paginationQueryDto: PaginationQueryHallOfFameDto,
    @Req() req: Request,
  ) {
    const { onlineBoardViewHallOfFames, totalItems } =
      await this.onlineBoardHallOfFameService.getViewRecentHallOfFame(
        paginationQueryDto,
      );
    const pageCount = Math.ceil(totalItems / paginationQueryDto.limit);
    const currentPage = paginationQueryDto.page;
    const startPage = Math.floor((currentPage - 1) / 100) * 100 + 1;
    let endPage = startPage + 9;
    if (endPage > pageCount) {
      endPage = pageCount;
    }
    return {
      statusCode: HttpStatus.OK,
      message: '자유 게시판 명예의 전당을 조회하였습니다.(조회수 순)',
      data: onlineBoardViewHallOfFames,
      pageCount,
      currentPage,
      startPage,
      endPage,
      isLoggedIn: req['isLoggedIn'],
      halloffameType: HalloffameType.OnlineBoardHallofFameViews,
    };
  }

  // 특정 명예의 전당 조회 투표수
  @ApiOperation({ summary: ' 특정 명예의 전당 조회 API (회원/비회원 구분 X)' })
  @ApiParam({
    name: 'hallOfFameId',
    required: true,
    description: ' 명예의 전당 투표 조회 ID',
    type: Number,
  })
  @Get('HallofFame/likes/:hallOfFameId')
  @Render('halloffamepost.ejs')
  async findOneByOnlineHallofFameLike(
    @Param('hallOfFameId') id: number,
    @Req() req: Request,
  ) {
    const data =
      await this.onlineBoardHallOfFameService.findOneByOnlineHallofFameLike(
        +id,
      );

    return {
      statusCode: HttpStatus.OK,
      message: '명예의 전당 데이터를 조회 성공하였습니다.',
      data,
      halloffameType: HalloffameType.OnlineBoardHallofFameLikes,
      isLoggedIn: req['isLoggedIn'],
    };
  }

  // 특정 명예의 전당 조회 투표수
  @ApiOperation({ summary: ' 특정 명예의 전당 조회 API (회원/비회원 구분 X)' })
  @ApiParam({
    name: 'hallOfFameId',
    required: true,
    description: ' 명예의 전당 투표 조회 ID',
    type: Number,
  })
  @Get('HallofFame/views/:hallOfFameId')
  @Render('halloffamepost.ejs')
  async findOneByOnlineHallofFameView(
    @Param('hallOfFameId') id: number,
    @Req() req: Request,
  ) {
    const data =
      await this.onlineBoardHallOfFameService.findOneByOnlineHallofFameView(
        +id,
      );

    return {
      statusCode: HttpStatus.OK,
      message: '명예의 전당 데이터를 조회 성공하였습니다.',
      data,
      halloffameType: HalloffameType.OnlineBoardHallofFameViews,
      isLoggedIn: req['isLoggedIn'],
    };
  }
}
