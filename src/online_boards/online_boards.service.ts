import { Injectable, ForbiddenException } from '@nestjs/common';
import { CreateOnlineBoardDto } from './dto/create-online_board.dto';
import { UpdateOnlineBoardDto } from './dto/update-online_board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OnlineBoards } from './entities/online_board.entity';
import { Like, Repository } from 'typeorm';
import { FindAllOnlineBoardDto } from './dto/findAll-online_board.dto';
import { UserInfos } from 'src/users/entities/user-info.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class OnlineBoardsService {
  constructor(
    @InjectRepository(OnlineBoards)
    private readonly onlineBoardsRepository: Repository<OnlineBoards>,
    @InjectRepository(UserInfos)
    private readonly usersService: UsersService,
  ) {}

  // 자유게시판 작성
  async createBoard(
    createOnlineBoardDto: CreateOnlineBoardDto,
    userInfo: UserInfos,
  ) {
    const { title, content } = createOnlineBoardDto;

    const foundUser = this.usersService.findByUserId(userInfo.id);

    return await this.onlineBoardsRepository.save({
      userId: foundUser.id,
      title,
      content,
    });
  }
  // 게시판 모두/키워드만 조회
  async findAllBoard(findAllOnlineBoardDto: FindAllOnlineBoardDto) {
    const { keyword } = findAllOnlineBoardDto;
    const shows = await this.onlineBoardsRepository.find({
      where: {
        ...(keyword && { title: Like(`%${keyword}%`) }),
      },
    });

    return shows;
  }

  // 자유게시판 단건 조회
  async findBoard(id: number) {
    const board = await this.onlineBoardsRepository.findOne({
      where: { id },
      relations: { OnlineBoardComment: true },
    });
    return board;
  }

  // 자유게시판 수정
  async updateBoard(
    id: number,
    updateOnlineBoardDto: UpdateOnlineBoardDto,
    userInfo: UserInfos,
  ) {
    const foundUser = this.usersService.findByUserId(userInfo.id);
    await this.findBoardByUserId(id, foundUser.id);
    const { title, content } = updateOnlineBoardDto;
    const board = await this.onlineBoardsRepository.save({
      id,
      title,
      content,
    });
    return board;
  }

  // 자유게시판 삭제
  async removeBoard(id: number, userInfo: UserInfos) {
    const foundUser = this.usersService.findByUserId(userInfo.id);
    await this.findBoardByUserId(id, foundUser.id);
    await this.onlineBoardsRepository.softDelete({ id });
    return `This action removes a #${id} onlineBoard`;
  }

  async findBoardByUserId(boardId: number, userId: number) {
    const foundBoard = await this.onlineBoardsRepository.findOneBy({
      id: boardId,
    });

    if (foundBoard.id !== userId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }
  }
}
