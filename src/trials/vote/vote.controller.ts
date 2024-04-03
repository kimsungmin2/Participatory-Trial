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
import { VotesService } from './vote.service';
import { VoteDto } from './dto/voteDto';
import { UserInfo } from '../../utils/decorator/userInfo.decorator';
import { userInfo } from 'os';
import { UserInfos } from '../../users/entities/user-info.entity';
import { Request } from 'express';
import { IsVoteGuard } from '../guards/isvote.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VoteForDto } from '../dto/vote.dto';
import { Users } from '../../users/entities/user.entity';

@Controller('trials/vote')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  // 투표하기 API
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '투표하기 API' })
  @Post(':voteId')
  // @ApiBody({
  //   description: '찬성 반대, 찬성일때 true',
  //   schema: {
  //     type: 'boolean',
  //     properties: {
  //       voteFor: { type: 'boolean' },
  //     },
  //   },
  // })
  @ApiParam({
    name: 'voteId',
    required: true,
    description: ' 투표 ID',
    type: Number,
  })
  async vote(
    @Param('voteId') voteId: number,
    @UserInfo() users: UserInfos,
    @Body() voteForDro: VoteForDto,
    @Req() req: Request,
  ) {
    // UserInfo에서 userInfo가 있으면 id 추출하고 없으면 null로 함req.user.id ? req.user.id :

    const userId = users.id ? users.id : null;
    const vote = await this.votesService.addVoteUserorNanUser(
      req,
      userId,
      voteId,
      voteForDro.voteFor,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: '투표에 성공하였습니다.',
      vote,
    };
  }

  // 투표 취소하기 API(회원 유저만 투표 취소 가능)
  @ApiOperation({ summary: '투표 취소 API' })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'uservoteId',
    required: true,
    description: ' 내가 투표한 것 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'), IsVoteGuard)
  @Delete(':voteId/:uservoteId')
  async canselEachVotes(@Param('uservoteId') uservoteId: number) {
    await this.votesService.canselEachVote(+uservoteId);
    return {
      statusCode: HttpStatus.OK,
      message: '투표를 기각하였습니다.',
    };
  }

  @Get(':voteId')
  async getVoteCounts(@Param('voteId') voteId: number) {
    const vote = await this.votesService.getVoteCounts(voteId);
    return {
      statusCode: HttpStatus.OK,
      message: '투표 현황입니다.',
      data: vote,
    };
  }
  @Get('member/:voteId')
  async getUserVoteCounts(@Param('voteId') voteId: number) {
    const vote = await this.votesService.getUserVoteCounts(voteId);
    return {
      statusCode: HttpStatus.OK,
      message: '투표 현황입니다.',
      data: vote,
    };
  }
}
