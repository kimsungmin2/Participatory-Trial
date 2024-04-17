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
import { UserInfo } from 'src/utils/decorator/userInfo.decorator';
import { userInfo } from 'os';
import { UserInfos } from 'src/users/entities/user-info.entity';
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
import { VoteForDto } from 'src/trials/dto/vote.dto';
import { IsVoteGuard } from 'src/trials/guards/isvote.guard';
import { HumorVotesService } from './humors_votes.service';

@ApiTags('유머 투표')
@Controller('humors/vote')
export class HumorVotesController {
  constructor(private readonly humorVotesService: HumorVotesService) {}

  // // 투표하기 API
  // @UseGuards(AuthGuard('jwt'))
  // @ApiOperation({ summary: '유머 게시판 투표하기 API' })
  // @Post(':humorVoteId')
  // // @ApiBody({
  // //   description: '찬성 반대, 찬성일때 true',
  // //   schema: {
  // //     type: 'boolean',
  // //     properties: {
  // //       voteFor: { type: 'boolean' },
  // //     },
  // //   },
  // // })
  // @ApiParam({
  //   name: 'humorVoteId',
  //   required: true,
  //   description: '유머 게시판 투표 ID',
  //   type: Number,
  // })
  // async vote(
  //   @Param('humorVoteId') humorVoteId: number,
  //   @UserInfo() users: UserInfos,
  //   @Body() voteForDro: VoteForDto,
  //   @Req() req: Request,
  // ) {
  //   // UserInfo에서 userInfo가 있으면 id 추출하고 없으면 null로 함req.user.id ? req.user.id :

  //   const userId = users.id ? users.id : null;
  //   const vote = await this.humorVotesService.addHumorVoteUserorNanUser(
  //     userCode,
  //     userId,
  //     humorVoteId,
  //     voteForDro.voteFor,
  //   );
  //   return {
  //     statusCode: HttpStatus.CREATED,
  //     message: '투표에 성공하였습니다.',
  //     vote,
  //   };
  // }

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
