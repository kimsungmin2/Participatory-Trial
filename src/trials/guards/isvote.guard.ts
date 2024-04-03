import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TrialsService } from '../trials.service';
import { Observable } from 'rxjs';
import { VotesService } from '../vote/vote.service';
import { UserInfos } from '../../users/entities/user-info.entity';

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
