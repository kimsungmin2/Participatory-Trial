import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
  Render,
  Req,
} from '@nestjs/common';
import { HumorsService } from './humors.service';
import { CreateHumorBoardDto } from './dto/create-humor.dto';
import { UpdateHumorDto } from './dto/update-humor.dto';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Users } from '../users/entities/user.entity';
import { HumorBoards } from './entities/humor-board.entity';
import { UserInfo } from '../utils/decorator/userInfo.decorator';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PaginationQueryDto } from './dto/get-humorBoard.dto';
import { BoardType } from '../s3/board-type';
import { LikeService } from '../like/like.service';
import { LikeInputDto } from '../like/dto/create-like.dto';
import { HumorHallOfFameService } from './hall_of_fameOfHumor';
import { Request } from 'express';
import { HumorSeedService } from './humor-seeed.service';
import { VoteTitleDto } from '../trials/vote/dto/voteDto';
import { HalloffameType } from '../s3/halloffame-type';
import { PaginationQueryHallOfFameDto } from './dto/get-pagenation.dto';
@ApiTags('유머 게시판')
@Controller('humors')
export class HumorsController {
  constructor(
    private readonly humorsService: HumorsService,
    private readonly likeService: LikeService,
    private readonly humorHallOfFameService: HumorHallOfFameService,
    private readonly humorSeedService: HumorSeedService,
  ) {}

  //글쓰기 페이지
  @ApiOperation({ summary: '유머 게시판 게시물 생성 페이지' })
  @Get('create')
  @UseGuards(AuthGuard('jwt'))
  @Render('create-post.ejs') // index.ejs 파일을 렌더링하여 응답
  async getCreatePostPage(@Req() req: Request) {
    return { boardType: BoardType.Humor, isLoggedIn: req['isLoggedIn'] };
  }

  @ApiOperation({ summary: '유머 게시판 게시물 수정 페이지' })
  @Get('update/:id')
  @UseGuards(AuthGuard('jwt'))
  @Render('update-post.ejs') // index.ejs 파일을 렌더링하여 응답
  async getUpdatePostPage(@Req() req: Request, @Param('id') id: number) {
    const data = await this.humorsService.findOneHumorBoard(id);
    return { boardType: BoardType.Humor, isLoggedIn: req['isLoggedIn'], data };
  }

  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '유머 게시판 게시물 생성' })
  @ApiBody({
    description: '유머 게시물 생성',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        title1: { type: 'string' },
        title2: { type: 'string' },
        files: {
          type: 'array',
          items: {
            format: 'binary',
            type: 'string',
          },
        },
      },
    },
  })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  /**
   * 유머게시물과 투표를 한번에 생성하는 함수임
   */
  async createHumorBoardAndVotes(
    @Body() createHumorBoardDto: CreateHumorBoardDto,
    @Body() voteTitleDto: VoteTitleDto,
    @UserInfo() user: Users,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const createdBoard = await this.humorsService.createHumorBoardAndVotes(
      createHumorBoardDto,
      voteTitleDto,
      user,
      files,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '게시물 생성에 성공하였습니다.',
      data: createdBoard,
    };
  }

  @ApiOperation({ summary: '모든 유머 게시물 조회' })
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
  @Get()
  @Render('board.ejs') // index.ejs 파일을 렌더링하여 응답
  async getAllHumorBoards(
    @Query() paginationQueryDto: PaginationQueryDto,
    @Req() req: Request,
  ) {
    const { humorBoards, totalItems } =
      await this.humorsService.getAllHumorBoards(paginationQueryDto);
    const pageCount = Math.ceil(totalItems / paginationQueryDto.limit);
    const currentPage = paginationQueryDto.page;
    const startPage = Math.floor((currentPage - 1) / 10) * 10 + 1;
    let endPage = startPage + 9;
    if (endPage > pageCount) {
      endPage = pageCount;
    }
    return {
      statusCode: HttpStatus.OK,
      message: '게시물 조회 성공',
      data: humorBoards,
      boardType: BoardType.Humor,
      pageCount,
      currentPage,
      startPage,
      endPage,
      isLoggedIn: req['isLoggedIn'],
    };
  }
  //단건 게시물 조회
  @ApiOperation({ summary: '단편 유머 게시물 조회' })
  @Get('/:id')
  @Render('post.ejs') // index.ejs 파일을 렌더링하여 응답
  @ApiParam({
    name: 'id',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  async findOneHumorBoard(@Param('id') id: number, @Req() req: Request) {
    const findHumorBoard: HumorBoards =
      await this.humorsService.findOneHumorBoardWithIncreaseView(id);
    return {
      statusCode: HttpStatus.OK,
      message: `${id}번 게시물 조회 성공`,
      data: findHumorBoard,
      boardType: BoardType.Humor,
      isLoggedIn: req['isLoggedIn'],
    };
  }
  @ApiOperation({ summary: '유머 게시물 수정' })
  @UseGuards(AuthGuard('jwt'))
  @Patch('/:humorBoardId')
  @ApiBody({
    description: '유머 게시물 수정',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
      },
    },
  })
  @ApiParam({
    name: 'humorBoardId',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  async updateHumorBoard(
    @Param('humorBoardId') humorBoardId: number,
    @Body() updateHumorDto: UpdateHumorDto,
    @UserInfo() user: Users,
  ) {
    const updatedHumorBoard = await this.humorsService.updateHumorBoard(
      humorBoardId,
      updateHumorDto,
      user,
    );
    return {
      statusCode: HttpStatus.OK,
      message: `${humorBoardId}번 게시물 업데이트 성공`,
      data: updatedHumorBoard,
    };
  }
  @ApiOperation({ summary: '유머 게시물 삭제' })
  @Delete('/:humorBoardId')
  @ApiParam({
    name: 'humorBoardId',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  async removeHumorBoard(
    @Param('humorBoardId') humorBoardId: number,
    @UserInfo() user: Users,
  ) {
    await this.humorsService.deleteHumorBoard(humorBoardId, user);

    return {
      statusCode: HttpStatus.OK,
      message: `${humorBoardId}번 게시물 삭제 성공`,
    };
  }

  // 유머 게시판 명예의 전당 조회하기 API(투표 수)
  @ApiOperation({ summary: ' 유머 게시판 명예의 전당 조회하기 API(투표 수)' })
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
  @Get('HallofFame/votes')
  @Render('halloffame.ejs') // index.ejs 파일을 렌더링하여 응답
  async getRecentHallOfFame(
    @Query() paginationQueryDto: PaginationQueryHallOfFameDto,
    @Req() req: Request,
  ) {
    const { humorsHallOfFame, totalItems } =
      await this.humorHallOfFameService.getRecentHallOfFame(paginationQueryDto);
    const pageCount = Math.ceil(totalItems / paginationQueryDto.limit);
    const currentPage = paginationQueryDto.page;
    const startPage = Math.floor((currentPage - 1) / 100) * 100 + 1;
    let endPage = startPage + 9;
    if (endPage > pageCount) {
      endPage = pageCount;
    }
    return {
      statusCode: HttpStatus.OK,
      message: '명예의 전당을 조회하였습니다.',
      data: humorsHallOfFame,
      pageCount,
      currentPage,
      startPage,
      endPage,
      isLoggedIn: req['isLoggedIn'],
      halloffameType: HalloffameType.HumorsHallofFameVotes,
    };
  }

  // 유머 게시판 명예의 전당 조회하기 API(종아요 수)
  @ApiOperation({ summary: '유머 게시판 명예의 전당 조회하기 API(종아요 수)' })
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
    const { humorsLikeHallOfFames, totalItems } =
      await this.humorHallOfFameService.getLikeRecentHallOfFame(
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
      message: '명예의 전당을 조회하였습니다.(좋아요 순)',
      data: humorsLikeHallOfFames,
      pageCount,
      currentPage,
      startPage,
      endPage,
      isLoggedIn: req['isLoggedIn'],
      halloffameType: HalloffameType.HumorsHallofFameLikes,
    };
  }

  // 유머 게시판 명예의 전당 조회하기 API(조회수 수)
  @ApiOperation({ summary: '유머 게시판 명예의 전당 조회하기 API(조회수 수)' })
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
    const { humorsViewHallOfFames, totalItems } =
      await this.humorHallOfFameService.getViewRecentHallOfFame(
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
      message: '명예의 전당을 조회하였습니다.',
      data: humorsViewHallOfFames,
      pageCount,
      currentPage,
      startPage,
      endPage,
      isLoggedIn: req['isLoggedIn'],
      halloffameType: HalloffameType.HumorsHallofFameViews,
    };
  }

  // 특정 명예의 전당 조회 API 투표 수
  @ApiOperation({ summary: ' 특정 명예의 전당 조회 API (회원/비회원 구분 X)' })
  @ApiParam({
    name: 'hallOfFameId',
    required: true,
    description: ' 명예의 전당 투표 조회 ID',
    type: Number,
  })
  @Get('HallofFame/votes/:hallOfFameId')
  @Render('halloffamepost.ejs')
  async findOneByhumorHallofFameVote(
    @Param('hallOfFameId') id: number,
    @Req() req: Request,
  ) {
    const data =
      await this.humorHallOfFameService.findOneByhumorHallofFameVote(+id);

    return {
      statusCode: HttpStatus.OK,
      message: '명예의 전당 데이터를 조회 성공하였습니다.',
      data,
      halloffameType: HalloffameType.TrialsHallofFameVotes,
      isLoggedIn: req['isLoggedIn'],
    };
  }

  // 특정 명예의 전당 조회 API 좋아요 수
  @ApiOperation({ summary: ' 특정 명예의 전당 조회 API (회원/비회원 구분 X)' })
  @ApiParam({
    name: 'hallOfFameId',
    required: true,
    description: ' 명예의 전당 좋아요 조회 ID',
    type: Number,
  })
  @Get('HallofFame/likes/:hallOfFameId')
  @Render('halloffamepost.ejs')
  async findOneByhumorHallofFameLike(
    @Param('hallOfFameId') id: number,
    @Req() req: Request,
  ) {
    const data =
      await this.humorHallOfFameService.findOneByhumorHallofFameLike(+id);

    return {
      statusCode: HttpStatus.OK,
      message: '명예의 전당 데이터를 조회 성공하였습니다.',
      data,
      halloffameType: HalloffameType.TrialsHallofFameLikes,
      isLoggedIn: req['isLoggedIn'],
    };
  }

  // 특정 명예의 전당 조회 API 조회수
  @ApiOperation({ summary: ' 특정 명예의 전당 조회 API (회원/비회원 구분 X)' })
  @ApiParam({
    name: 'hallOfFameId',
    required: true,
    description: ' 명예의 전당 좋아요 조회 ID',
    type: Number,
  })
  @Get('HallofFame/views/:hallOfFameId')
  @Render('halloffamepost.ejs')
  async findOneByhumorHallofFameView(
    @Param('hallOfFameId') id: number,
    @Req() req: Request,
  ) {
    const data =
      await this.humorHallOfFameService.findOneByhumorHallofFameViews(+id);

    return {
      statusCode: HttpStatus.OK,
      message: '명예의 전당 데이터를 조회 성공하였습니다.',
      data,
      halloffameType: HalloffameType.TrialsHallofFameViews,
      isLoggedIn: req['isLoggedIn'],
    };
  }

  @ApiOperation({ summary: '더미 생성' })
  @ApiParam({
    name: 'count',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  @Post('some/:count')
  async createDummyData(@Param('count') count: number) {
    await this.humorSeedService.saveHumorToDataBase(count);

    return {
      message: `${count}개 생성 완료`,
    };
  }
}
