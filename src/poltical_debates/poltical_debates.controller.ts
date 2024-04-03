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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UpdatePolticalDebateDto } from './dto/update-poltical_debate.dto';
import { Users } from '../users/entities/user.entity';
import { UserInfo } from '../utils/decorator/userInfo.decorator';
import { UserInfos } from '../users/entities/user-info.entity';
import { BoardType } from '../s3/board-type';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PaginationQueryDto } from '../humors/dto/get-humorBoard.dto';

@ApiTags('정치 토론')
@Controller('poltical-debates')
export class PolticalDebatesController {
  constructor(
    private readonly polticalDebatesService: PolticalDebatesService,
  ) {}

  @Get('create')
  @Render('create-post.ejs') // index.ejs 파일을 렌더링하여 응답
  async getCreatePostPage() {
    return { boardType: BoardType.PolticalDebate };
  }

  @ApiOperation({ summary: '정치 토론 게시판 생성', description: '생성' })
  @UseInterceptors(FilesInterceptor('files'))
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @UserInfo() userInfo: UserInfos,
    @Body() createPolticalDebateDto: CreatePolticalDebateDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const data = await this.polticalDebatesService.create(
      userInfo,
      createPolticalDebateDto,
      files,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '보드 생성에 성공했습니다.',
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
}
