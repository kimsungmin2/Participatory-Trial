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
  Req,
  Render,
  UseInterceptors,
} from '@nestjs/common';
import { TrialsService } from './trials.service';
import { UpdateTrialDto } from './dto/update-trial.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserInfo } from '../utils/decorator/userInfo.decorator';

import { UserInfos } from 'src/users/entities/user-info.entity';
import { VoteTitleDto } from './vote/dto/voteDto';
import { number } from 'joi';
import { IsActiveGuard } from './guards/isActive.guard';
import { UpdateVoteDto } from './vote/dto/updateDto';
import { TrialHallOfFameService } from './trial_hall_of_fame.service';
import { AuthGuard } from '@nestjs/passport';
import { LikeInputDto } from 'src/like/dto/create-like.dto';
import { LikeService } from 'src/like/like.service';
import { Users } from 'src/users/entities/user.entity';
import { CreateTrialDto } from './dto/create-trial.dto';
import { BoardType } from '../s3/board-type';
import { PaginationQueryDto } from '../humors/dto/get-humorBoard.dto';
import { Request } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('재판')
@Controller('trials')
export class TrialsController {
  constructor(
    private readonly trialsService: TrialsService,
    private readonly trialHallOfFameService: TrialHallOfFameService,
    private readonly likeServise: LikeService,
  ) {}
  // 모든 API는 비동기 처리

  // -------------------------------------------------------------------------- 재판 API ----------------------------------------------------------------------//
  // 어쓰 가드 필요\

  // 글쓰기 페이지 이동
  @Get('create')
  @Render('create-post.ejs') // index.ejs 파일을 렌더링하여 응답
  async getCreatePostPage(@Req() req: Request) {
    return {
      boardType: BoardType.Trial,
      isLoggedIn: req['isLoggedIn'],
    };
  }
  // 재판 생성 API
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: '재판 생성 API' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @ApiBody({
    description: '재판 게시물 생성',
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
    @Body() createTrialDto: CreateTrialDto, // 재판 제목하고 재판 내용 들어감
    @Body() voteTitleDto: VoteTitleDto,
    @Req() req,
  ) {
    console.log(createTrialDto);
    console.log(voteTitleDto);
    // 1. 유저 아이디 2. 재판 제목 3. 재판 내용
    // const voteTitleDto = {
    //   title1: 'ss',
    //   title2: 'ss',
    // };
    // const createTrialDto = {
    //   title: '22',
    //   content: '22',
    //   trialTime: new Date(),
    // };

    const user = req.user;
    const data = await this.trialsService.createTrial(
      user.id,
      createTrialDto,
      voteTitleDto,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '재판 생성에 성공하였습니다.',
      data,
    };
  }

  // 모든 판례 조회 API
  @ApiOperation({ summary: '모든 판례 조회 API' })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: '커서',
    type: 'string',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '몇 장 가져오건지 ',
    type: 'string',
    example: 1,
  })
  @Get('cases')
  async getAllDetails(
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
  ) {
    let cursorNumber = parseInt(cursor);
    let limitNumber = parseInt(limit);
    console.log(cursorNumber);
    console.log(limitNumber);

    if (isNaN(cursorNumber) || isNaN(limitNumber)) {
      cursorNumber = 0;
      limitNumber = 10;
    }

    return await this.trialsService.getAllDetails(cursorNumber, limitNumber);
  }

  // 특정 판례 조회 API(Like 구문)
  @ApiOperation({ summary: '특정 판례 조회 API' })
  @ApiQuery({
    name: 'name',
    required: false,
    description: '키워드',
    type: String,
    example: '재판',
  })
  @Get('cases/some')
  async findKeyWordDetails(@Query('name') name: string) {
    return await this.trialsService.findKeyWordDetails(name);
  }

  // 판결 유형으로 조회 API(일반 인덱싱 구문)
  @ApiOperation({ summary: ' 판례 유형 조회 API' })
  @ApiQuery({
    name: 'name',
    required: false,
    description: '유형',
    type: String,
    example: '폭행',
  })
  @Get('cases/panguelcase')
  async findBypanguelcaseDetails(@Query('name') name: string) {
    return await this.trialsService.findBypanguelcaseDetails(name);
  }

  // 내가 만든 재판 조회 API(유저)
  @ApiOperation({ summary: ' 내가 만든 재판 게시물 API' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get('/myTrials')
  async findByUserTrials(@UserInfo() userInfo: UserInfos) {
    // 유저 아이디만 필요함

    const data = await this.trialsService.findByUserTrials(userInfo.id);

    return {
      statusCode: HttpStatus.CREATED,
      message: '내 재판 조회에 성공하였습니다.',
      data,
    };
  }

  // 모든 재판 조회 API(회원/비회원 구분 없음)
  @ApiOperation({ summary: ' 모든 게시판 조회 재판 게시물 API' })
  @Get('')
  @Render('board.ejs')
  async findAllTrials(
    @Query() paginationQueryDto: PaginationQueryDto,
    @Req() req: Request,
  ) {
    const { allTrials, totalItems } =
      await this.trialsService.findAllTrials(paginationQueryDto);
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
      data: allTrials,
      boardType: BoardType.Trial,
      pageCount,
      currentPage,
      startPage,
      endPage,
      isLoggedIn: req['isLoggedIn'],
    };
  }

  // 특정 재판 조회 API(회원/비회원 구분 X)
  @Render('post.ejs')
  @ApiOperation({ summary: ' 특정 재판 조회 API (회원/비회원 구분 X)' })
  @ApiParam({
    name: 'trialsId',
    required: true,
    description: ' 재판 게시물 ID',
    type: Number,
  })
  @Get(':trialsId')
  async findOneByTrialsId(@Param('trialsId') id: number, @Req() req: Request) {
    const data = await this.trialsService.findOneByTrialsId(+id);

    return {
      statusCode: HttpStatus.OK,
      message: '재판 검색에 성공하였습니다.',
      data,
      boardType: BoardType.Trial,
      isLoggedIn: req['isLoggedIn'],
    };
  }

  // 특정 재판 수정 API(내 재판 수정)
  @ApiOperation({ summary: ' 특정 재판 수정 API(내 재판 수정)' })
  @ApiBearerAuth('access-token')
  @ApiBody({
    description: '재판 게시물 수정',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        trialTime: { type: 'number' },
      },
    },
  })
  @ApiParam({
    name: 'trialsId',
    required: true,
    description: ' 재판 게시물 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  // @UseGuards(MyTrialsGuard)
  @Patch(':trialsId')
  async update(
    @Param('trialsId') trialsId: number,
    @Body() updateTrialDto: UpdateTrialDto,
    @UserInfo() userInfo: UserInfos,
  ) {
    const data = await this.trialsService.updateTrials(
      userInfo.id,
      +trialsId,
      updateTrialDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '재판 수정에 성공하였습니다.',
      data,
    };
  }

  // 내 재판 삭제 API
  @ApiOperation({ summary: ' 내 재판 게시물 삭제 API' })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'trialsId',
    required: true,
    description: ' 재판 게시물 ID',
    type: Number,
  })
  @UseGuards()
  @Delete(':trialsId')
  async remove(@Param('trialsId') id: string) {
    await this.trialsService.deleteTrials(+id);
    return {
      statusCode: HttpStatus.OK,
      message: '재판 삭제에 성공하였습니다.',
    };
  }

  // 재판 게시물 좋아요 API
  @ApiOperation({ summary: '재판 게시판 좋아요/좋아요 취소' })
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
    name: 'trialId',
    required: true,
    description: '재판 게시물 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  @Post('/:trialId/like')
  async like(
    @Param('trialId') trialId: number,
    @UserInfo() user: Users,
    @Body() likeInputDto: LikeInputDto,
  ) {
    const result = await this.likeServise.like(likeInputDto, user, trialId);

    return {
      statusCode: HttpStatus.OK,
      message: result,
    };
  }
  // --------------------------------------------------------------------------------------------------------------------------------------------------------------------//
  // -------------------------------------------------------------------------- 재판 vs API ----------------------------------------------------------------------//

  // 투표 vs 생성 API
  @ApiOperation({ summary: ' 투표 vs 생성 API' })
  @ApiBearerAuth('access-token')
  @ApiBody({
    description: '투표 vs 생성',
    schema: {
      type: 'object',
      properties: {
        title1: { type: 'string' },
        title2: { type: 'string' },
      },
    },
  })
  @ApiParam({
    name: 'trialId',
    required: true,
    description: ' 재판 게시물 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'), IsActiveGuard)
  @Post(':trialId')
  async voteOfSubject(
    @Param('trialId') trialId: number,
    @Body() voteDto: VoteTitleDto,
  ) {
    const data = await this.trialsService.createSubject(+trialId, voteDto);
    return {
      statusCode: HttpStatus.OK,
      message: '재판 토론 vs 대결 주제를 생성 성공하였습니다.',
      data,
    };
  }

  // 투표 vs 수정 API
  @ApiOperation({ summary: ' 투표 vs 수정 API' })
  @ApiBearerAuth('access-token')
  @ApiBody({
    description: '투표 vs 생성',
    schema: {
      type: 'object',
      properties: {
        title1: { type: 'string' },
        title2: { type: 'string' },
      },
    },
  })
  @ApiParam({
    name: 'trialId',
    required: true,
    description: ' 재판 게시물 ID',
    type: Number,
  })
  @ApiParam({
    name: 'voteId',
    required: true,
    description: ' 투표 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  @UseGuards()
  @UseGuards(IsActiveGuard)
  @Patch(':trialId/vote/:voteId')
  async patchOfVote(
    @Param('trialId') trialId: number,
    @Param('voteId') voteId: number,
    @Body() updateVoteDto: UpdateVoteDto,
  ) {
    const data = await this.trialsService.updateSubject(voteId, updateVoteDto);
    return {
      statusCode: HttpStatus.OK,
      message: '재판 vs 주제를 수정하였습니다.',
      data,
    };
  }

  // 투표 vs 삭제 API
  @ApiOperation({ summary: ' 투표 vs 수정 API' })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'trialId',
    required: true,
    description: ' 재판 게시물 ID',
    type: Number,
  })
  @ApiParam({
    name: 'voteId',
    required: true,
    description: '투표 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  @UseGuards()
  @UseGuards(IsActiveGuard)
  @Delete(':trialId/vote/:voteId')
  async deleteVote(
    @Param('trialsId') id: string,
    @Param('voteId') voteId: number,
  ) {
    await this.trialsService.deleteVote(+voteId);
    return {
      statusCode: HttpStatus.OK,
      message: '재판 vs 삭제에 성공하였습니다.',
    };
  }

  // -------------------------------------------------------------------------------------------------------------------------------------------------------------//
  // ----------------------------------------------------------------------- 명예의 전당 ------------------------------------------------------------------------------ //

  // 명예의 전당 올리기 API(수동으로 업뎃함)
  @ApiOperation({ summary: ' 명예의 전당 올리기 API(수동으로 업뎃함)' })
  @ApiBearerAuth('access-token')
  @Post('HallofFame/update')
  async updateHallofFame() {
    await this.trialHallOfFameService.updateHallOfFame();
    return {
      statusCode: HttpStatus.OK,
      message: '명예의 전당이 성공적으로 갱신되었습니다..',
    };
  }

  // 명예의 전당 조회하기 API(투표 수)
  @ApiOperation({ summary: ' 명예의 전당 조회하기 API(투표 수)' })
  @Get('HallofFame/votes')
  async getRecentHallOfFame() {
    const recentHallofFame =
      await this.trialHallOfFameService.getRecentHallOfFame();
    if (!recentHallofFame) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: '명예의 전당 정보가 없습니다.',
      };
    }

    return {
      statusCode: HttpStatus.OK,
      message: '명예의 전당을 조회하였습니다.(투표 수 순)',
      recentHallofFame,
    };
  }

  // 명예의 전당 조회하기 API(종아요 수)
  @ApiOperation({ summary: '명예의 전당 조회하기 API(종아요 수)' })
  @Get('HallofFame/likes')
  async getRecentLikeHallOfFame() {
    const recentHallofFame =
      await this.trialHallOfFameService.getLikeRecentHallOfFame();
    if (!recentHallofFame) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: '명예의 전당 정보가 없습니다.',
      };
    }
    return {
      statusCode: HttpStatus.OK,
      message: '명예의 전당을 조회하였습니다.(좋아요 순)',
      recentHallofFame,
    };
  }

  // 명예의 전당 조회하기 API(조회수 수)
  @ApiOperation({ summary: '명예의 전당 조회하기 API(조회수 수)' })
  @Get('HallofFame/views')
  async getRecentViewHallOfFame() {
    const recentHallofFame =
      await this.trialHallOfFameService.getViewRecentHallOfFame();
    if (!recentHallofFame) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: '명예의 전당 정보가 없습니다.',
      };
    }
    return {
      statusCode: HttpStatus.OK,
      message: '명예의 전당을 조회하였습니다.(조회수 순)',
      recentHallofFame,
    };
  }
  // 판례 조회 API
  @Get('cases')
  async getCaseDetails(@Query('caseId') caseId: string) {
    return await this.trialsService.getCaseDetails(caseId);
  }

  // 명예의 전당 올리기 API

  //
  //
}
