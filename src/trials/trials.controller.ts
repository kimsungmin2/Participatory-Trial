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
} from '@nestjs/common';
import { TrialsService } from './trials.service';
import { CreateTrialDto } from './dto/create-trial.dto';
import { UpdateTrialDto } from './dto/update-trial.dto';
import { ApiTags } from '@nestjs/swagger';
import { UserInfo } from '../utils/decorator/userInfo.decorator';
import { UserInfos } from 'src/users/entities/user-info.entity';
import { MyTrialsGuard } from './guards/myTrials.guard';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Trials')
@Controller('trials')
export class TrialsController {
  constructor(private readonly trialsService: TrialsService) {}
  // 모든 API는 비동기 처리

  // 어쓰 가드 필요
  // 재판 생성 API
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @UserInfo() userInfo: UserInfos,
    @Body() createTrialDto: CreateTrialDto, // 재판 제목하고 재판 내용 들어감
  ) {
    // 1. 유저 아이디 2. 재판 제목 3. 재판 내용

    const data = await this.trialsService.createTrial(
      userInfo.id,
      createTrialDto,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '재판 생성에 성공하였습니다.',
      data,
    };
  }

  // 모든 판례 조회 API
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

  // 내가 만든 재판 조회 API(유저)
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
  @Get('/AllTrials')
  async findAllTrials() {
    const data = await this.trialsService.findAllTrials();

    return {
      statusCode: HttpStatus.OK,
      message: '모든 조회에 성공하였습니다.',
      data,
    };
  }

  // 특정 재판 조회 API(회원/비회원 구분 X)
  @Get(':trialsId')
  async findOneByTrialsId(@Param('trialsId') id: number) {
    const data = await this.trialsService.findOneByTrialsId(+id);

    return {
      statusCode: HttpStatus.OK,
      message: '재판 검색에 성공하였습니다.',
      data,
    };
  }

  // 특정 재판 수정 API(내 재판 수정)
  @UseGuards(MyTrialsGuard)
  @Patch(':trialsId')
  async update(
    @Param('trialsId') id: string,
    @Body() updateTrialDto: UpdateTrialDto,
    @UserInfo() userInfo: UserInfos,
  ) {
    const data = await this.trialsService.updateTrials(
      userInfo.id,
      +id,
      updateTrialDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '재판 수정에 성공하였습니다.',
      data,
    };
  }

  // 내 재판 삭제 API
  @UseGuards(MyTrialsGuard)
  @Delete(':trialsId')
  async remove(@Param('trialsId') id: string) {
    await this.trialsService.deleteTrials(+id);
    return {
      statusCode: HttpStatus.OK,
      message: '재판 삭제에 성공하였습니다.',
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
