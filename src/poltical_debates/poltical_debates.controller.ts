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
} from '@nestjs/common';
import { PolticalDebatesService } from './poltical_debates.service';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserInfos } from 'src/users/entities/user-info.entity';
import { UpdatePolticalDebateDto } from 'src/poltical_debates/dto/update-poltical_debate.dto';
import { Users } from 'src/users/entities/user.entity';
import { UserInfo } from 'src/utils/decorator/userInfo.decorator';

@ApiTags('정치 토론')
@UseGuards(AuthGuard('jwt'))
@Controller('polticalDebates')
export class PolticalDebatesController {
  constructor(
    private readonly polticalDebatesService: PolticalDebatesService,
  ) {}

  @ApiOperation({ summary: '정치 토론 게시판 생성', description: '생성' })
  @Post()
  async create(
    @UserInfo() userInfo: Users,
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
  @Get('my')
  async findMyBoards(@UserInfo() userInfo: UserInfos) {
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

  @ApiOperation({
    summary: '정치 토론 게시판 상세 조회',
    description: '상세 조회',
  })
  @Get(':polticalDebateId')
  async findOne(@Param('polticalDebateId') id: string) {
    try {
      const data = await this.polticalDebatesService.findOne(+id);
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
    await this.polticalDebatesService.update(
      userInfo,
      +id,
      updatePolticalDebateDto,
    );

    const updatedBoard = await this.polticalDebatesService.findOne(+id);

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
    const data = this.polticalDebatesService.delete(userInfo, +id);

    return {
      statusCode: HttpStatus.OK,
      message: '정치 토론방이 삭제되었습니다.',
      data,
    };
  }
}
