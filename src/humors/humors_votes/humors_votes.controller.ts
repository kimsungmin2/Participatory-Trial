// votes.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  Delete,
  UseGuards,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { userInfo } from 'os';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Users } from '../../users/entities/user.entity';
import { HumorVotesService } from './humors_votes.service';
import { UserInfo } from '../../utils/decorator/userInfo.decorator';
import { VoteForDto } from '../../trials/dto/vote.dto';
import { UserInfos } from '../../users/entities/user-info.entity';

@ApiTags('유머 투표')
@Controller('humors/vote')
export class HumorVotesController {
  constructor(private readonly humorVotesService: HumorVotesService) {}

  // 투표 취소하기 API(회원 유저만 투표 취소 가능)
  @ApiOperation({ summary: '투표 취소 API' })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'uservoteId',
    required: true,
    description: ' 내가 투표한 것 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  @Delete(':humorVoteId/:uservoteId')
  async canselEachVotes(@Param('uservoteId') uservoteId: number) {
    await this.humorVotesService.canselEachVote(+uservoteId);
    return {
      statusCode: HttpStatus.OK,
      message: '투표를 기각하였습니다.',
    };
  }

  // 투표 현황 조회하기 API(회원 유저만 투표 취소 가능)
  @Get(':humorVoteId')
  async getVoteCounts(@Param('humorVoteId') humorVoteId: number) {
    const vote = await this.humorVotesService.getVoteCounts(humorVoteId);
    return {
      statusCode: HttpStatus.OK,
      message: '투표 현황입니다.',
      data: vote,
    };
  }

  // 투표 현황 조회 하기 API
  @Get('member/:humorVoteId')
  async getUserVoteCounts(@Param('humorVoteId') humorVoteId: number) {
    const vote = await this.humorVotesService.getUserVoteCounts(humorVoteId);
    return {
      statusCode: HttpStatus.OK,
      message: '투표 현황입니다.',
      data: vote,
    };
  }
}
