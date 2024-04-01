import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthGuard } from '@nestjs/passport';
import { OnlineBoardComments } from '../entities/online_board_comment.entity';

@Injectable()
export class CommentOwnerGuard extends AuthGuard('jwt') {
  constructor(
    @InjectRepository(OnlineBoardComments)
    private readonly onlineBoardCommentsRepository: Repository<OnlineBoardComments>,
    private readonly reflector: Reflector,
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
    const commentId = req.params.commentId;

    console.log('BoardOwnerGuard:', userId, commentId);

    const verifyCommentOwner = await this.onlineBoardCommentsRepository.findOne(
      {
        where: { userId, id: commentId },
      },
    );

    console.log('verifyCommentOwner: ', verifyCommentOwner);

    if (!verifyCommentOwner) {
      throw new ForbiddenException(
        '해당 사용자의 정보와 댓글의 정보가 일치하지 않습니다.',
      );
    }

    return true;
  }
}
