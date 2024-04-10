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
} from '@nestjs/common';
import { PolticalDebatesService } from './poltical_debates.service';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UpdatePolticalDebateDto } from './dto/update-poltical_debate.dto';
import { Users } from '../users/entities/user.entity';
import { UserInfo } from '../utils/decorator/userInfo.decorator';
import { UserInfos } from '../users/entities/user-info.entity';
<<<<<<< HEAD
import { PolticalDabateHallOfFameService } from './politcal_debate_hall_of_fame.service';
import { VoteTitleDto } from 'src/trials/vote/dto/voteDto';
=======
import { BoardType } from '../s3/board-type';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PaginationQueryDto } from '../humors/dto/get-humorBoard.dto';
>>>>>>> 34602244a3eebb81cb9e123a3922b52e3fb21519

@ApiTags('정치 토론')
@Controller('poltical-debates')
export class PolticalDebatesController {
  constructor(
    private readonly polticalDebatesService: PolticalDebatesService,
    private readonly polticalDabateHallOfFameService: PolticalDabateHallOfFameService
  ) {}

<<<<<<< HEAD

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
=======
  @Get('create')
  @Render('create-post.ejs') // index.ejs 파일을 렌더링하여 응답
  async getCreatePostPage() {
    return { boardType: BoardType.PolticalDebate };
  }

  @ApiOperation({ summary: '정치 토론 게시판 생성', description: '생성' })
  @UseInterceptors(FilesInterceptor('files'))
>>>>>>> 34602244a3eebb81cb9e123a3922b52e3fb21519
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @UserInfo() userInfo: UserInfos,
    @Body() createPolticalDebateDto: CreatePolticalDebateDto,
<<<<<<< HEAD
    @Body() voteTitleDto: VoteTitleDto

=======
    @UploadedFiles() files: Express.Multer.File[],
>>>>>>> 34602244a3eebb81cb9e123a3922b52e3fb21519
  ) {
    const userId = userInfo.id
    const data = await this.polticalDebatesService.createBothBoardandVote(
      userId,
      createPolticalDebateDto,
<<<<<<< HEAD
      voteTitleDto,
=======
      files,
>>>>>>> 34602244a3eebb81cb9e123a3922b52e3fb21519
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
  ): Promise<HumorBoardReturnValue> {
    const { polticalDebateBoards, totalItems } =
      await this.polticalDebatesService.findAll(paginationQueryDto);
    const pageCount = Math.ceil(totalItems / paginationQueryDto.limit);
    return {
      statusCode: HttpStatus.OK,
      message: '게시물 조회 성공',
      data: polticalDebateBoards,
      boardType: BoardType.PolticalDebate,
      pageCount,
      currentPage: paginationQueryDto.page,
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
  async findOne(@Param('polticalDebateId') id: number) {
    try {
      const data = await this.polticalDebatesService.findOne(id);
      return {
        statusCode: HttpStatus.OK,
        message: '정치 토론 상세 조회에 성공했습니다.',
        data,
        boardType: BoardType.PolticalDebate,
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
   @Get('HallofFame/votes')
   async getRecentHallOfFame() {
     const recentHallofFame =
       await this.polticalDabateHallOfFameService.getRecentHallOfFame();
     if (!recentHallofFame) {
       return {
         statusCode: HttpStatus.NOT_FOUND,
         message: '정치 게시판 명예의 전당 정보가 없습니다.',
       };
     }
 
     return {
       statusCode: HttpStatus.OK,
       message: '정치 게시판 명예의 전당을 조회하였습니다.(투표 수 순)',
       recentHallofFame,
     };
   }

   // 유머 게시판 명예의 전당 조회하기 API(조회수 수)
  @ApiOperation({ summary: '정치 게시판 명예의 전당 조회하기 API(조회수 수)' })
  @Get('HallofFame/views')
  async getRecentViewHallOfFame() {
    const recentHallofFame =
      await this.polticalDabateHallOfFameService.getViewRecentHallOfFame();
    if (!recentHallofFame) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: '정치 게시판 명예의 전당 정보가 없습니다.',
      };
    }
    return {
      statusCode: HttpStatus.OK,
      message: '정치 게시판 명예의 전당을 조회하였습니다.(조회수 순)',
      recentHallofFame,
    };
  }
}
