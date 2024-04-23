import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthGuard } from '@nestjs/passport';
import { OnlineBoardCommentService } from '../online_board_comment.service';
import { OnlineBoardComments } from '../entities/online_board_comment.entity';

@Injectable()
export class CommentOwnerGuard extends AuthGuard('jwt') {
  constructor(
    @InjectRepository(OnlineBoardComments)
    private readonly onlineBoardsRepository: Repository<OnlineBoardComments>,
    private readonly reflector: Reflector,
    private readonly onlineBoardCommentService: OnlineBoardCommentService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authenticated = await super.canActivate(context);
    if (!authenticated) {
      throw new UnauthorizedException('인증 정보가 잘못되었습니다.');
    }

    const req = context.switchToHttp().getRequest();
    const userId = req.user.id;
    const commentId = req.params.commentId; // Convert boardId to number

    await this.onlineBoardCommentService.verifyCommentOwner(userId, commentId);

    return true;
  }
}
