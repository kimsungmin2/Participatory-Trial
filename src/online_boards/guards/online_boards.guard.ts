import {
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { OnlineBoards } from '../entities/online_board.entity';
import { Repository } from 'typeorm';
import { AuthGuard } from '@nestjs/passport';
import { OnlineBoardsService } from '../online_boards.service';

@Injectable()
export class BoardOwnerGuard extends AuthGuard('jwt') {
  constructor(
    @InjectRepository(OnlineBoards)
    private readonly onlineBoardsRepository: Repository<OnlineBoards>,
    private readonly reflector: Reflector,
    private readonly onlineBoardsService: OnlineBoardsService,
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
    const boardId = req.params.id; // Convert boardId to number

    const foundBoardOwner = await this.onlineBoardsService.verifyBoardOwner(
      userId,
      boardId,
    );

    if (!foundBoardOwner) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    return true;
  }
}
