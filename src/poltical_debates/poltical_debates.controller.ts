import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { PolticalDebatesService } from './poltical_debates.service';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserInfos } from 'src/users/entities/user-info.entity';
import { UserInfo } from 'src/utils/decorator/userInfo.decorator';

@ApiTags('정치 토론')
@UseGuards(AuthGuard('jwt'))
@Controller('poltical_Debates')
export class PolticalDebatesController {
  constructor(
    private readonly polticalDebatesService: PolticalDebatesService,
  ) {}

  /**
   * 정치 토론 생성
   * @param createBoardDto
   * @returns
   */
  @Post()
  create(
    @UserInfo() userInfo: UserInfos,
    @Body() createPolticalDebateDto: CreatePolticalDebateDto,
  ) {
    console.log(userInfo);
    const data = this.polticalDebatesService.create(
      userInfo,
      createPolticalDebateDto,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '정치 토론방을  생성하였습니다.',
      data,
    };
  }

  /**
   * 로그인없이 보드 전체 목록 조회
   * @returns
   */
  @Get()
  async findAll() {
    const data = this.polticalDebatesService.findAll();

    return {
      statusCode: HttpStatus.OK,
      message: '모든 정치 토론 조회에 성공했습니다.',
      data,
    };
  }

  /**
   * 유저의 정치 토론방 전체 목록 조회
   * @returns
   */
  @Get('my')
  async myfindAll(@UserInfo() userInfo: UserInfos) {
    const data = this.polticalDebatesService.myfindAll(userInfo);

    return {
      statusCode: HttpStatus.OK,
      message: '나의 정치 토론 조회에 성공했습니다.',
      data,
    };
  }

  /**
   * 게스트의 정치 토론 상세 조회
   * @returns
   */
  @Get(':polticalDebateId')
  findOne(@Param('polticalDebateId') id: string) {
    const data = this.polticalDebatesService.findOne(+id);

    return {
      statusCode: HttpStatus.OK,
      message: '정치 토론 상세 조회에 성공했습니다.',
      data,
    };
  }

  /**
   * 유저 정치 토론방 상세 조회
   * @returns
   */
  @Get(':polticalDebateId')
  async myfindOne(
    @UserInfo() userInfo: UserInfos,
    @Param('polticalDebateId') id: string,
  ) {
    const data = await this.polticalDebatesService.myfindOne(userInfo, +id);

    return {
      statusCode: HttpStatus.OK,
      message: '정치 토론 상세 조회에 성공했습니다.',
      data,
    };
  }

  /**
   * 정치 토론방 수정
   * @returns
   */
  @Patch(':polticalDebateId')
  async update(
    @UserInfo() userInfo: UserInfos,
    @Param('polticalDebateId') id: string,
    @Body() createPolticalDebateDto: CreatePolticalDebateDto,
  ) {
    const data = this.polticalDebatesService.update(
      userInfo,
      +id,
      createPolticalDebateDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '정치 토론방이 수정됐습니다.',
      data,
    };
  }

  /**
   * 정치 토론방 삭제
   * @returns
   */
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
