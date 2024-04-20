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
} from '@nestjs/common';
import { VotesService } from './vote.service';
import { UserInfo } from 'src/utils/decorator/userInfo.decorator';
import { userInfo } from 'os';
import { UserInfos } from 'src/users/entities/user-info.entity';
import { Request } from 'express';
import { IsVoteGuard } from '../guards/isvote.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@Controller('trials/vote')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

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
  @UseGuards(IsVoteGuard)
  @Delete(':voteId/:uservoteId')
  async canselEachVotes(@Param('uservoteId') uservoteId: number) {
    await this.votesService.canselEachVote(+uservoteId);
    return {
      statusCode: HttpStatus.OK,
      message: '투표를 기각하였습니다.',
    };
  }
}
