import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { OnlineBoardsService } from './online_boards.service';
import { CreateOnlineBoardDto } from './dto/create-online_board.dto';
import { UpdateOnlineBoardDto } from './dto/update-online_board.dto';
import { FindAllOnlineBoardDto } from './dto/findAll-online_board.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from 'src/utils/decorator/userInfo.decorator';
import { UserInfos } from 'src/users/entities/user-info.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('online-boards')
export class OnlineBoardsController {
  constructor(private readonly onlineBoardsService: OnlineBoardsService) {}

  @Post()
  async create(
    @Body() createOnlineBoardDto: CreateOnlineBoardDto,
    @UserInfo() userInfo: UserInfos,
  ) {
    return await this.onlineBoardsService.createBoard(
      createOnlineBoardDto,
      userInfo,
    );
  }

  @Get()
  findAll(@Body() findAllOnlineBoardDto: FindAllOnlineBoardDto) {
    return this.onlineBoardsService.findAllBoard(findAllOnlineBoardDto);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.onlineBoardsService.findBoard(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updateOnlineBoardDto: UpdateOnlineBoardDto,
    @UserInfo() userInfo: UserInfos,
  ) {
    return this.onlineBoardsService.updateBoard(
      id,
      updateOnlineBoardDto,
      userInfo,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: number, @UserInfo() userInfo: UserInfos) {
    return this.onlineBoardsService.removeBoard(id, userInfo);
  }
}
