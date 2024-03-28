import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import { PolticalDebatesService } from './poltical_debates.service';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';
import { UpdatePolticalDebateDto } from './dto/update-poltical_debate.dto';
import { ApiTags } from '@nestjs/swagger';
import { Users } from 'src/users/entities/user.entity';

@ApiTags('보드 정보')
@Controller('poltical_debates')
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
  create(@Body() createPolticalDebateDto: CreatePolticalDebateDto) {
    const data = this.polticalDebatesService.create(createPolticalDebateDto);

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
   * 로그인한 사람의 보드 전체 목록 조회
   * @returns
   */
  // @Get('my')
  // async MyfindAll(@GetUser() user: Users) {
  //   const userId = user.id
  //   const data = this.polticalDebatesService.MyfindAll(userId)

  //   return {
  //     statusCode: HttpStatus.OK,
  //     message: '나의 정치 토론 조회에 성공했습니다.',
  //     data,
  //   };
  // }

  /**
   * 로그인한 사람의 보드 전체 목록 조회
   * @returns
   */
  @Get(':poltical_debate_id')
  findOne(@Param('poltical_debate_id') id: string) {
    const data = this.polticalDebatesService.findOne(+id);

    return {
      statusCode: HttpStatus.OK,
      message: '정치 토론 상세 조회에 성공했습니다.',
      data,
    };
  }

  //  /**
  //  * 내가 만든 정치 토론방 상세 조회
  //  * @returns
  //  */
  // @Get(':poltical_debate_id')
  // myfindOne(@GetUser() user: Users, @Param('poltical_debate_id') id: string) {
  //   const userId = user.id
  //   const data = this.polticalDebatesService.myfindOne(userId, +id);

  //   return {
  //     statusCode: HttpStatus.OK,
  //     message: '정치 토론 상세 조회에 성공했습니다.',
  //     data,
  //   };
  // }

  // @Patch(':poltical_debate_id')
  // update(
  //   @GetUser() user: Users,
  //   @Param('poltical_debate_id') id: string,
  //   @Body() createPolticalDebateDto:CreatePolticalDebateDto,
  // ) {
  //   const userId = user.id
  //   const data = this.polticalDebatesService.update(userId, +id, createPolticalDebateDto);

  //   return {
  //     statusCode: HttpStatus.OK,
  //     message: '정치 토론방이 수정됐습니다.',
  //     data
  //   };
  //}

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.polticalDebatesService.remove(+id);
  }
}
