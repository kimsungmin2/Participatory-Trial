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
  Render,
} from '@nestjs/common';
import { PolticalDebatesService } from './poltical_debates.service';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UpdatePolticalDebateDto } from './dto/update-poltical_debate.dto';
import { Users } from '../users/entities/user.entity';
import { UserInfo } from '../utils/decorator/userInfo.decorator';
import { UserInfos } from '../users/entities/user-info.entity';

@ApiTags('정치 토론')
@Controller('poltical-debates')
export class PolticalDebatesController {
  constructor(
    private readonly polticalDebatesService: PolticalDebatesService,
  ) {}

  @ApiOperation({ summary: '정치 토론 게시판 생성', description: '생성' })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @UserInfo() userInfo: UserInfos,
    @Body() createPolticalDebateDto: CreatePolticalDebateDto,
  ) {
    const data = await this.polticalDebatesService.create(
      userInfo,
      createPolticalDebateDto,
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
  async findAll() {
    const data = await this.polticalDebatesService.findAll();

    return {
      statusCode: HttpStatus.OK,
      message: '모든 정치 토론 조회에 성공했습니다.',
      data,
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
  @Render('vote.ejs')
  async findOne(@Param('polticalDebateId') id: string) {
    try {
      const data = await this.polticalDebatesService.findOne(+id);
      console.log(data);
      return {
        statusCode: HttpStatus.OK,
        message: '정치 토론 상세 조회에 성공했습니다.',
        data,
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
