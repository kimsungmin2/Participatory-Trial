import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { VotesService } from '../vote/vote.service';

@Injectable()
export class IsVoteGuard implements CanActivate {
  constructor(private votesService: VotesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const user = request.user;
    const userVoteId = request.params.uservoteId;

    const userVote = await this.votesService.checkIsUserVoteGuard(
      userVoteId,
      user.id,
    );
    return !!userVote;
  }
}
