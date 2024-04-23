import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
  Patch,
  NotFoundException,
  BadRequestException,
  Render,
  UseInterceptors,
  UploadedFiles,
  Query,
  Req,
} from '@nestjs/common';
import { PolticalDebatesService } from './poltical_debates.service';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UpdatePolticalDebateDto } from './dto/update-poltical_debate.dto';
import { Users } from '../users/entities/user.entity';
import { UserInfo } from '../utils/decorator/userInfo.decorator';
import { UserInfos } from '../users/entities/user-info.entity';
import { PolticalDabateHallOfFameService } from './politcal_debate_hall_of_fame.service';
import { VoteTitleDto } from 'src/trials/vote/dto/voteDto';
import { PaginationQueryDto } from 'src/humors/dto/get-humorBoard.dto';
import { BoardType } from 'src/s3/board-type';
import { FilesInterceptor } from '@nestjs/platform-express';
import { start } from 'repl';
import { th } from '@faker-js/faker';
import { HalloffameType } from 'src/s3/halloffame-type';
import { PaginationQueryHallOfFameDto } from 'src/humors/dto/get-pagenation.dto';

@ApiTags('정치 토론')
@Controller('poltical-debates')
export class PolticalDebatesController {
  constructor(
    private readonly polticalDebatesService: PolticalDebatesService,
    private readonly polticalDabateHallOfFameService: PolticalDabateHallOfFameService,
  ) {}

  @Get('create')
  @Render('create-post.ejs') // index.ejs 파일을 렌더링하여 응답
  async getCreatePostPage(@Req() req: Request) {
    return {
      boardType: BoardType.PolticalDebate,
      isLoggedIn: req['isLoggedIn'],
    };
  }

  @ApiOperation({ summary: '정치토론 게시판 게시물 수정 페이지' })
  @Get('update/:id')
  @UseGuards(AuthGuard('jwt'))
  @Render('update-post.ejs') // index.ejs 파일을 렌더링하여 응답
  async getUpdatePostPage(@Req() req: Request, @Param('id') id: number) {
    const data = await this.polticalDebatesService.findOne(id);
    return {
      boardType: BoardType.PolticalDebate,
      isLoggedIn: req['isLoggedIn'],
      data,
    };
  }

  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '정치토론 게시판 게시물 생성' })
  @ApiBody({
    description: '정치토론 게시판 게시물 생성',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
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
  /**
   *
   * @param userInfo 유저 정보 받아오는 데코레이터
   * @param createPolticalDebateDto 제목, 컨텐츠 받아오는 Dto
   * @param voteTitleDto  title1 vs title 하는 Dto
   * @returns
   */
  @ApiOperation({ summary: '정치 토론 게시판 생성', description: '생성' })
  @ApiBearerAuth('access-token')
  @ApiBody({
    description: '정치 게시물 생성',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        trialTime: { type: 'number' },
        title1: { type: 'string' },
        title2: { type: 'string' },
      },
    },
  })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @UserInfo() userInfo: UserInfos,
    @Body() createPolticalDebateDto: CreatePolticalDebateDto,
    @Body() voteTitleDto: VoteTitleDto,
  ) {
    const userId = userInfo.id;
    const data = await this.polticalDebatesService.createBothBoardandVote(
      userId,
      createPolticalDebateDto,
      voteTitleDto,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '정치 게시판과 투표 생성에 성공했습니다.',
      data,
    };
  }

  //전체 조회
  @ApiOperation({
    summary: '정치 토론 게시판 전체 조회',
    description: '전체 조회',
  })
  @Get()
  @Render('board.ejs') // index.ejs 파일을 렌더링하여 응답
  async findAll(
    @Query() paginationQueryDto: PaginationQueryDto,
    @Req() req: Request,
  ) {
    const { polticalDebateBoards, totalItems } =
      await this.polticalDebatesService.findAllWithPaginateBoard(
        paginationQueryDto,
      );
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
      data: polticalDebateBoards,
      boardType: BoardType.PolticalDebate,
      pageCount,
      currentPage,
      startPage,
      endPage,
      isLoggedIn: req['isLoggedIn'],
    };
  }

  //내 게시판 조회
  @ApiOperation({ summary: '유저의 정치 토론방 조회', description: '조회' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get('my')
  async findMyBoards(@UserInfo() userInfo: Users) {
    try {
      const userId = userInfo.id;
      const boards = await this.polticalDebatesService.findMyBoards(userId);
      return {
        statusCode: HttpStatus.OK,
        message: '정치 토론 게시판 조회에 성공했습니다.',
        data: boards,
      };
    } catch (error) {
      throw new NotFoundException('정치 토론 게시판을 찾을 수 없습니다.');
    }
  }

  // 상세 조회
  @ApiOperation({
    summary: '정치 토론 게시판 상세 조회',
    description: '상세 조회',
  })
  @ApiParam({
    name: 'polticalDebateId',
    required: true,
    description: ' 정치 토론 게시판ID',
    type: Number,
  })
  @Get(':polticalDebateId')
  @Render('post.ejs') // index.ejs 파일을 렌더링하여 응답
  async findOne(@Param('polticalDebateId') id: number, @Req() req: Request) {
    try {
      const data = await this.polticalDebatesService.findOne(id);
      return {
        statusCode: HttpStatus.OK,
        message: '정치 토론 상세 조회에 성공했습니다.',
        data,
        boardType: BoardType.PolticalDebate,
        isLoggedIn: req['isLoggedIn'],
      };
    } catch (error) {
      throw new NotFoundException('존재하지 않는 정치 토론방입니다.');
    }
  }

  //게시판 수정
  @ApiOperation({ summary: '정치 토론 게시판 수정', description: '수정' })
  @ApiParam({
    name: 'polticalDebateId',
    required: true,
    description: ' 정치 토론 게시판ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  @Patch(':polticalDebateId')
  async update(
    @UserInfo() userInfo: UserInfos,
    @Param('polticalDebateId') id: string,
    @Body() updatePolticalDebateDto: UpdatePolticalDebateDto,
  ) {
    const updatedBoard = await this.polticalDebatesService.update(
      userInfo,
      +id,
      updatePolticalDebateDto,
    );
    console.log(updatedBoard);
    return {
      statusCode: HttpStatus.OK,
      message: '정치 토론방이 수정되었습니다.',
      data: updatedBoard,
    };
  }

  //게시판 삭제
  @ApiOperation({ summary: '정치 토론 게시판 삭제', description: '삭제' })
  @ApiParam({
    name: 'polticalDebateId',
    required: true,
    description: ' 정치 토론 게시판 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  @Delete(':polticalDebateId')
  async delete(
    @UserInfo() userInfo: UserInfos,
    @Param('polticalDebateId') id: string,
  ) {
    const deleteBoard = await this.polticalDebatesService.delete(userInfo, +id);

    return {
      statusCode: HttpStatus.OK,
      message: '정치 토론방이 삭제되었습니다.',
      data: deleteBoard,
    };
  }

  // 정치 게시판 명예의 전당 조회하기 API(투표 수)
  @ApiOperation({ summary: ' 정치 게시판 명예의 전당 조회하기 API(투표 수)' })
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
    @Query() paginationQueryDto:PaginationQueryHallOfFameDto,
    @Req() req: Request,
  ) {
    const { polticalDebateHallOfFame, totalItems }= await this.polticalDabateHallOfFameService.getRecentHallOfFame(paginationQueryDto)
    const pageCount = Math.ceil(totalItems / paginationQueryDto.limit);
    const currentPage = paginationQueryDto.page;
    const startPage = Math.floor((currentPage - 1) / 100) * 100 + 1
    let endPage = startPage + 9;
    if(endPage > pageCount) {
      endPage = pageCount;
    }
    return {
      statusCode: HttpStatus.OK,
      message: '정치 게시판 명예의 전당을 조회하였습니다.(투표 수 순)',
      data: polticalDebateHallOfFame,
      pageCount,
      currentPage,
      startPage,
      endPage,
      isLoggedIn: req['isLoggedIn'],
      halloffameType: HalloffameType.PolticalHallofFameVotes
    };
  }

  // 유머 게시판 명예의 전당 조회하기 API(조회수 수)
  @ApiOperation({ summary: '정치 게시판 명예의 전당 조회하기 API(조회수 수)' })
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
    const { polticalDebateBoardsViewHallOfFames, totalItems } = await this.polticalDabateHallOfFameService.getViewRecentHallOfFame(paginationQueryDto);
    const pageCount = Math.ceil(totalItems / paginationQueryDto.limit);
    const currentPage = paginationQueryDto.page;
    const startPage = Math.floor((currentPage - 1) / 100) * 100 + 1
    let endPage = startPage + 9;
    if(endPage > pageCount) {
      endPage = pageCount;
    }
    return {
      statusCode: HttpStatus.OK,
      message: '정치 게시판 명예의 전당을 조회하였습니다.(조회수 순)',
      data: polticalDebateBoardsViewHallOfFames,
      pageCount,
      currentPage,
      startPage,
      endPage,
      isLoggedIn: req['isLoggedIn'],
      halloffameType: HalloffameType.PolticalHallofFameViews
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
  @Get('HallofFame/votes/:hallOfFameId')
  @Render('halloffamepost.ejs')
  async findOneByPoliteHallofFameVote(@Param('hallOfFameId') id: number, @Req() req: Request) {
    const data = await this.polticalDabateHallOfFameService.findOneByPoliteHallofFameVote(+id);

    return {
      statusCode: HttpStatus.OK,
      message: '명예의 전당 데이터를 조회 성공하였습니다.',
      data,
      halloffameType: HalloffameType.PolticalHallofFameVotes,
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
  async findOneByPoliteHallofFameView(@Param('hallOfFameId') id: number, @Req() req: Request) {
    const data = await this.polticalDabateHallOfFameService.findOneByPoliteHallofFameView(+id);

    return {
      statusCode: HttpStatus.OK,
      message: '명예의 전당 데이터를 조회 성공하였습니다.',
      data,
      halloffameType: HalloffameType.PolticalHallofFameViews,
      isLoggedIn: req['isLoggedIn'],
    };
  }
}
