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
import { UserInfo } from '../../utils/decorator/userInfo.decorator';
import { userInfo } from 'os';
import { UserInfos } from '../../users/entities/user-info.entity';
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
import { PolticalVotesService } from './poltical_debates_vote.service';
import { VoteForDto } from '../../trials/dto/vote.dto';
import { IsVoteGuard } from '../../trials/guards/isvote.guard';

@ApiTags('정치 토론 투표')
@Controller('poltical-debates/vote')
export class PolticalVotesController {
  constructor(private readonly polticalVotesService: PolticalVotesService) {}

  // 투표 취소하기 API(회원 유저만 투표 취소 가능)
  @ApiOperation({ summary: '투표 취소 API' })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'uservoteId',
    required: true,
    description: ' 내가 투표한 것 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt')) // 투표 가드 필요
  @Delete(':polticalVoteId/:uservoteId')
  async canselEachVotes(@Param('uservoteId') uservoteId: number) {
    await this.polticalVotesService.canselEachVote(+uservoteId);
    return {
      statusCode: HttpStatus.OK,
      message: '투표를 기각하였습니다.',
    };
  }

  // 투표 현황 조회하기 API(회원 유저만 투표 취소 가능)
  @ApiOperation({ summary: '정치 투표 게시판 투표 취소 API' })
  @ApiParam({
    name: 'polticalVoteId',
    required: true,
    description: ' 정치 토론 게시판 투표 ID',
    type: Number,
  })
  @Get(':polticalVoteId')
  async getVoteCounts(@Param('polticalVoteId') polticalVoteId: number) {
    const vote = await this.polticalVotesService.getVoteCounts(polticalVoteId);
    return {
      statusCode: HttpStatus.OK,
      message: '투표 현황입니다.',
      data: vote,
    };
  }

  // 투표 현황 조회 하기 API
  @Get('member/:polticalVoteId')
  @ApiParam({
    name: 'polticalVoteId',
    required: true,
    description: ' 정치 토론 게시판 투표 ID',
    type: Number,
  })
  async getUserVoteCounts(@Param('polticalVoteId') polticalVoteId: number) {
    const vote =
      await this.polticalVotesService.getUserVoteCounts(polticalVoteId);
    return {
      statusCode: HttpStatus.OK,
      message: '투표 현황입니다.',
      data: vote,
    };
  }
}
