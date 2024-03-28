import {
  Controller,
  Body,
  Patch,
  Delete,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation } from '@nestjs/swagger';
import { UpdateDto } from './dto/update.dto';
import { DeleteDto } from './dto/delete.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @ApiOperation({ summary: '닉네임 변경', description: '업데이트' })
  @Patch('')
  async userUpdate(@Body() updateDto: UpdateDto, @Req() req) {
    const { id } = req.user;

    const userUpdate = await this.usersService.userUpdate(
      id,
      updateDto.nickName,
    );
    return userUpdate;
  }
  @ApiOperation({ summary: '유저 삭제', description: '삭제' })
  @Delete('')
  async userDelete(@Body() deleteDto: DeleteDto, @Req() req) {
    const { id } = req.user;
    if (deleteDto.password !== deleteDto.confirmPassword) {
      throw new ForbiddenException(
        '입력한 비밀번호와 확인 비밀번호가 같지 않습니다.',
      );
    }
    return await this.usersService.userDelete(id);
  }
}
