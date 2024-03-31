// votes.controller.ts
import { Controller, Post, Body, Param, Req, Delete, UseGuards } from '@nestjs/common';
import { VotesService } from './vote.service';
import { VoteDto } from './dto/voteDto';
import { UserInfo } from 'src/utils/decorator/userInfo.decorator';
import { userInfo } from 'os';
import { UserInfos } from 'src/users/entities/user-info.entity';
import { Request } from 'express';
import { IsVoteGuard } from '../guards/isvote.guard';

@Controller('trials/vote')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}


  // 투표하기 API
  @Post(':voteId')
  async vote(
    @Param('voteId') voteId: number, 
    @UserInfo() userInfo: UserInfos,
    @Body() voteFor: boolean,
    @Req() req: Request,
    ) {

    // UserInfo에서 userInfo가 있으면 id 추출하고 없으면 null로 함
    const userId = userInfo ? userInfo.id : null;
    await this.votesService.addVoteUserorNanUser(req, userId, voteId, voteFor);
    return { message: "투표가 정상적으로 처리되었습니다."}
  }
  

  // 투표 취소하기 API(회원 유저만 투표 취소 가능)
  @UseGuards(IsVoteGuard)
  @Delete(':voteId/:uservoteId')
  async canselEachVotes(
  @Param('uservoteId') uservoteId: number,
  ){
    await this.votesService.canselEachVote(+uservoteId)
  }
}
