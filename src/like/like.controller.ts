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

@UseGuards(AuthGuard('jwt'))
@Controller('like')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

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

  @Get()
  findAll() {
    return this.likeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.likeService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.likeService.remove(+id);
  }
}
