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
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('좋아요 기능')
@UseGuards(AuthGuard('jwt'))
@Controller('like')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @ApiOperation({ summary: '게시판 별 좋아요/좋아요 취소' })
  @ApiBody({
    description: '좋아요/좋아요 취소',
    schema: {
      type: 'object',
      properties: {
        boardId: { type: 'number' },
        boardType: { type: 'string' },
      },
    },
  })
  @Post()
  async create(
    @Body() likeInputDto: LikeInputDto,
    @UserInfo() user: Users,
  ): Promise<HumorBoardReturnValue> {
    const result = await this.likeService.create(likeInputDto, user);

    return {
      statusCode: HttpStatus.OK,
      message: result,
    };
  }
}
