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
import { PolticalVotesService } from './poltical_debates_vote.service';
import { UserInfo } from '../../utils/decorator/userInfo.decorator';
import { VoteForDto } from '../../trials/dto/vote.dto';
import { UserInfos } from '../../users/entities/user-info.entity';

@ApiTags('정치 토론 투표')
@Controller('poltical-debates/vote')
export class PolticalVotesController {
  constructor(private readonly polticalVotesService: PolticalVotesService) {}

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
    name: 'polticalVoteId',
    required: true,
    description: ' 정치 토론 게시판 투표 ID',
    type: Number,
  })
  async vote(
    @Param('polticalVoteId') polticalVoteId: number,
    @UserInfo() users: UserInfos,
    @Body() voteForDro: VoteForDto,
    @Req() req: Request,
  ) {
    // UserInfo에서 userInfo가 있으면 id 추출하고 없으면 null로 함req.user.id ? req.user.id :

    const userId = users.id ? users.id : null;
    const vote = await this.polticalVotesService.addVoteUserorNanUser(
      req,
      userId,
      polticalVoteId,
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
