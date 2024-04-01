// votes.controller.ts
import { Controller, Post, Body, Param, Req, Delete, UseGuards, HttpStatus } from '@nestjs/common';
import { VotesService } from './vote.service';
import { VoteDto } from './dto/voteDto';
import { UserInfo } from 'src/utils/decorator/userInfo.decorator';
import { userInfo } from 'os';
import { UserInfos } from 'src/users/entities/user-info.entity';
import { Request } from 'express';
import { IsVoteGuard } from '../guards/isvote.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@Controller('trials/vote')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}


  // 투표하기 API
  @ApiOperation({ summary: "투표하기 API" })
  @Post(':voteId')
  @ApiBody({
    description :'찬성 반대, 찬성일때 true',
    schema: {
      type: 'boolean',
      properties: {
        voteFor: { type : 'boolean' },
      }
    }
  })
  @ApiParam({
    name : 'voteId',
    required : true,
    description :" 투표 ID",
    type: Number
  })
  async vote(
    @Param('voteId') voteId: number, 
    @UserInfo() userInfo: UserInfos,
    @Body() voteFor: boolean,
    @Req() req: Request,
    ) {

    // UserInfo에서 userInfo가 있으면 id 추출하고 없으면 null로 함
    const userId = userInfo ? userInfo.id : null;
    const vote = await this.votesService.addVoteUserorNanUser(req, userId, voteId, voteFor);
    return  {
      statusCode: HttpStatus.CREATED,
      message: "투표에 성공하였습니다.",
      vote
    }
  }
  

  // 투표 취소하기 API(회원 유저만 투표 취소 가능)
  @ApiOperation({ summary: "투표 취소 API" })
  @ApiBearerAuth("access-token")
  @ApiParam({
    name : 'uservoteId',
    required : true,
    description :" 내가 투표한 것 ID",
    type: Number
  })
  @UseGuards(AuthGuard('jwt'))
  @UseGuards(IsVoteGuard)
  @Delete(':voteId/:uservoteId')
  async canselEachVotes(
  @Param('uservoteId') uservoteId: number,
  ){
    await this.votesService.canselEachVote(+uservoteId)
    return  {
      statusCode: HttpStatus.OK,
      message: "투표를 기각하였습니다.",
    }
  }
}
