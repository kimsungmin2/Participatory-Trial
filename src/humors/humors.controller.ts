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
import { VoteTitleDto } from 'src/trials/vote/dto/voteDto';
import { Request } from 'express';
@ApiTags('유머 게시판')
@Controller('humors')
export class HumorsController {
  constructor(
    private readonly humorsService: HumorsService,
    private readonly likeService: LikeService,
    private readonly humorHallOfFameService: HumorHallOfFameService,
  ) {}

  //글쓰기 페이지
  @ApiOperation({ summary: '유머 게시판 게시물 생성 페이지' })
  @Get('create')
  @Render('create-post.ejs') // index.ejs 파일을 렌더링하여 응답
  async getCreatePostPage(@Req() req: Request) {
    return { boardType: BoardType.Humor, isLoggedIn: req['isLoggedIn'] };
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
  @Patch('humor-board/:humorBoardId')
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
  @Delete('humor-board/:humorBoardId')
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
  //humors/25/like
  @ApiOperation({ summary: '유머 게시판 좋아요/좋아요 취소' })
  @ApiBody({
    description: '좋아요/좋아요 취소',
    schema: {
      type: 'object',
      properties: {
        boardType: { type: 'string' },
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
  @Post('/humor-board/:humorBoardId/like')
  async like(
    @Param('humorBoardId') humorBoardId: number,
    @UserInfo() user: Users,
    @Body() likeInputDto: LikeInputDto,
  ) {
    const result = await this.likeService.like(
      likeInputDto,
      user,
      humorBoardId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: result,
    };
  }

  // 유머 게시판 명예의 전당 조회하기 API(투표 수)
  @ApiOperation({ summary: ' 유머 게시판 명예의 전당 조회하기 API(투표 수)' })
  @Get('HallofFame/votes')
  async getRecentHallOfFame() {
    const recentHallofFame =
      await this.humorHallOfFameService.getRecentHallOfFame();
    if (!recentHallofFame) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: '유머 게시판 명예의 전당 정보가 없습니다.',
      };
    }

    return {
      statusCode: HttpStatus.OK,
      message: '유머 게시판 명예의 전당을 조회하였습니다.(투표 수 순)',
      recentHallofFame,
    };
  }

  // 유머 게시판 명예의 전당 조회하기 API(종아요 수)
  @ApiOperation({ summary: '유머 게시판 명예의 전당 조회하기 API(종아요 수)' })
  @Get('HallofFame/likes')
  async getRecentLikeHallOfFame() {
    const recentHallofFame =
      await this.humorHallOfFameService.getLikeRecentHallOfFame();
    if (!recentHallofFame) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: '유머 게시판 명예의 전당 정보가 없습니다.',
      };
    }
    return {
      statusCode: HttpStatus.OK,
      message: '유머 게시판 명예의 전당을 조회하였습니다.(좋아요 순)',
      recentHallofFame,
    };
  }

  // 유머 게시판 명예의 전당 조회하기 API(조회수 수)
  @ApiOperation({ summary: '유머 게시판 명예의 전당 조회하기 API(조회수 수)' })
  @Get('HallofFame/views')
  async getRecentViewHallOfFame() {
    const recentHallofFame =
      await this.humorHallOfFameService.getViewRecentHallOfFame();
    if (!recentHallofFame) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: '유머 게시판 명예의 전당 정보가 없습니다.',
      };
    }
    return {
      statusCode: HttpStatus.OK,
      message: '유머 게시판 명예의 전당을 조회하였습니다.(조회수 순)',
      recentHallofFame,
    };
  }
}
