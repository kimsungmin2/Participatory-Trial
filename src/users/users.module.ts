import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { UserInfos } from './entities/user-info.entity';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users, UserInfos, OnlineBoards])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
