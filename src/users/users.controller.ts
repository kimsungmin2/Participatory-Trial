import {
  Controller,
  Body,
  Patch,
  Delete,
  Req,
  ForbiddenException,
  UseGuards,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateDto } from './dto/update.dto';
import { DeleteDto } from './dto/delete.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtOpAuthGuard } from '../utils/guard/jwtop.guard';
import { IGuestRequest } from '../utils/interface/guest.interface';

@ApiTags('USER_UD')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @ApiOperation({ summary: '닉네임 변경', description: '업데이트' })
  @UseGuards(JwtOpAuthGuard)
  @Patch('')
  async userUpdate(@Body() updateDto: UpdateDto, @Req() req: IGuestRequest) {
    const id = req.id;
    const userUpdate = await this.usersService.userUpdate(
      id,
      updateDto.nickName,
    );
    return {
      statusCode: HttpStatus.OK,
      message: '닉네임 변경에 성공하였습니다.',
      userUpdate,
    };
  }

  @ApiOperation({ summary: '유저 삭제', description: '삭제' })
  @UseGuards(AuthGuard('jwt'))
  @Delete('')
  async userDelete(@Body() deleteDto: DeleteDto, @Req() req) {
    const { id } = req.user;
    if (deleteDto.password !== deleteDto.confirmPassword) {
      throw new ForbiddenException(
        '입력한 비밀번호와 확인 비밀번호가 같지 않습니다.',
      );
    }
    const data = await this.usersService.userDelete(id);
    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: '회원 탈퇴가 완료됐습니다.',
      data,
    };
  }

  @UseGuards(JwtOpAuthGuard)
  @Post('register-token')
  async registerToken(
    @Body() subscriptionData: any,
    @Req() req: IGuestRequest,
  ) {
    const id = req.id;

    const result = await this.usersService.updateClientsInfo(
      id,
      subscriptionData,
    );
    return result;
  }
}
