import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus, Query } from '@nestjs/common';
import { TrialsService } from './trials.service';
import { CreateTrialDto } from './dto/create-trial.dto';
import { UpdateTrialDto } from './dto/update-trial.dto';
import { ApiTags } from '@nestjs/swagger';
import { UserInfo } from '../utils/decorator/userInfo.decorator';
import { UserInfos } from 'src/users/entities/user-info.entity';
import { userInfo } from 'os';
import { MyTrialsGuard } from './guards/myTrials.guard';
import { VoteDto } from './vote/dto/voteDto';
import { number } from 'joi';
import { IsActiveGuard } from './guards/isActive.guard';
import { UpdateVoteDto } from './vote/dto/updateDto';

@ApiTags("Trials")
@Controller('trials')
export class TrialsController {
  constructor(private readonly trialsService: TrialsService) {}
  // 모든 API는 비동기 처리


// -------------------------------------------------------------------------- 재판 API ----------------------------------------------------------------------//
  // 어쓰 가드 필요
  // 재판 생성 API
  @Post()
  async create(
    @UserInfo() userInfo: UserInfos,
    @Body() createTrialDto: CreateTrialDto, // 재판 제목하고 재판 내용 들어감
    ) { // 1. 유저 아이디 2. 재판 제목 3. 재판 내용

    const data = await this.trialsService.createTrial(userInfo.id, createTrialDto)

    return  {
      statusCode: HttpStatus.CREATED,
      message: "재판 생성에 성공하였습니다.",
      data
    }
  }

  // 모든 판례 조회 API 
  @Get('cases')
  async getAllDetails(
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    ){
      let cursorNumber = parseInt(cursor)
      let limitNumber = parseInt(limit)
      console.log(cursorNumber)
      console.log(limitNumber)

      if(isNaN(cursorNumber) || isNaN(limitNumber))
      {
        cursorNumber = 0;
        limitNumber = 10;
      }
      
    return await this.trialsService.getAllDetails(cursorNumber, limitNumber);
  }

  // 특정 판례 조회 API(Like 구문)
  @Get('cases/some')
  async findKeyWordDetails(
    @Query('name') name: string,
  ){
    return await this.trialsService.findKeyWordDetails(name)
  }

  // 판결 유형으로 조회 API(일반 인덱싱 구문)
  @Get('cases/panguelcase')
  async findBypanguelcaseDetails(
    @Query('name') name: string,
  ){
    return await this.trialsService.findBypanguelcaseDetails(name)
  }

  // 내가 만든 재판 조회 API(유저)
  @Get('/myTrials')
  async findByUserTrials(
    @UserInfo() userInfo :UserInfos,
  ) { // 유저 아이디만 필요함

    const data = await this.trialsService.findByUserTrials(userInfo.id)

    return  {
      statusCode: HttpStatus.CREATED,
      message: "내 재판 조회에 성공하였습니다.",
      data
    }
  }



  // 모든 재판 조회 API(회원/비회원 구분 없음)
  @Get('/AllTrials')
  async findAllTrials() {
    const data = await this.trialsService.findAllTrials();

    return  {
      statusCode: HttpStatus.OK,
      message: "모든 조회에 성공하였습니다.",
      data
    }
  }


  // 특정 재판 조회 API(회원/비회원 구분 X)
  @Get(':trialsId')
  async findOneByTrialsId(
    @Param('trialsId') id: number,
  ) {
    const data = await this.trialsService.findOneByTrialsId(+id);

    return  {
      statusCode: HttpStatus.OK,
      message: "재판 검색에 성공하였습니다.",
      data
    }
  }


  // 특정 재판 수정 API(내 재판 수정)
  @UseGuards(MyTrialsGuard)
  @Patch(':trialsId')
  async update(
   @Param('trialsId') id: string,
   @Body() updateTrialDto: UpdateTrialDto,
   @UserInfo() userInfo :UserInfos,
   ) {
    const data = await this.trialsService.updateTrials(userInfo.id, +id, updateTrialDto);

    return  {
      statusCode: HttpStatus.OK,
      message: "재판 수정에 성공하였습니다.",
      data
    }
  }

  // 내 재판 삭제 API
  @UseGuards(MyTrialsGuard)
  @Delete(':trialsId')
  async remove(
    @Param('trialsId') id: string,
    ) {
      await this.trialsService.deleteTrials(+id)
      return  {
        statusCode: HttpStatus.OK,
        message: "재판 삭제에 성공하였습니다.",
      }
  }


// --------------------------------------------------------------------------------------------------------------------------------------------------------------------//
// -------------------------------------------------------------------------- 재판 vs API ----------------------------------------------------------------------//
  




  // 투표 vs 생성 API
  @UseGuards(MyTrialsGuard)
  @UseGuards(IsActiveGuard)
  @Post(':trialId')
  async voteOfSubject(
    @Param('trialId') trialId: number,
    @Body() voteDto: VoteDto
){
  const data = await this.trialsService.createSubject(+trialId, voteDto)
      return  {
        statusCode: HttpStatus.OK,
        message: "재판 토론 vs 대결 주제를 생성 성공하였습니다.",
        data
      }
}

  // 투표 vs 수정 API
  @UseGuards(MyTrialsGuard)
  @UseGuards(IsActiveGuard)
  @Patch(':trialId/vote/:voteId')
  async patchOfVote(
    @Param('trialId') trialId: number,
    @Param('voteId') voteId: number,
    @Body() updateVoteDto: UpdateVoteDto
  ) {
    const data = await this.trialsService.updateSubject(voteId, updateVoteDto)
      return  {
        statusCode: HttpStatus.OK,
        message: "재판 vs 주제를 수정하였습니다.",
        data
      }

  }

  // 투표 vs 삭제 API
  @UseGuards(MyTrialsGuard)
  @UseGuards(IsActiveGuard)
  @Delete(':trialId/vote/:voteId')
  async deleteVote(
    @Param('trialsId') id: string,
    @Param('voteId') voteId: number,
    ) {
      await this.trialsService.deleteVote(+voteId)
      return  {
        statusCode: HttpStatus.OK,
        message: "재판 vs 삭제에 성공하였습니다.",
      }
  }

// -------------------------------------------------------------------------------------------------------------------------------------------------------------//
// ----------------------------------------------------------------------- 명예의 전당 ------------------------------------------------------------------------------ //

  // 명예의 전당 올리기 API

  




  // 
}
