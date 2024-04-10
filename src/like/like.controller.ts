import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { LikeService } from './like.service';

import { AuthGuard } from '@nestjs/passport';
import { LikeInputDto } from './dto/create-like.dto';
import { userInfo } from 'os';
import { UserInfo } from '../utils/decorator/userInfo.decorator';
import { Users } from '../users/entities/user.entity';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('좋아요 기능')
@UseGuards(AuthGuard('jwt'))
@Controller('like')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @ApiBody({
    description: '좋아요',
    schema: {
      type: 'object',
      properties: {
        boardType: { type: 'string' },
      },
    },
  })
  @ApiParam({
    name: 'boardId',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  @Post('/:boardId')
  async create(
    @Body() likeInputDto: LikeInputDto,
    @UserInfo() user: Users,
    @Param('boardId') boardId: number,
  ): Promise<HumorBoardReturnValue> {
    const result = await this.likeService.like(likeInputDto, user, boardId);

    return {
      statusCode: HttpStatus.OK,
      message: result,
    };
  }
}
