import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateOnlineBoardDto } from './dto/create-online_board.dto';
import { UpdateOnlineBoardDto } from './dto/update-online_board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OnlineBoards } from './entities/online_board.entity';
import { Like, Repository } from 'typeorm';
import { FindAllOnlineBoardDto } from './dto/findAll-online_board.dto';
import { UserInfos } from '../users/entities/user-info.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class OnlineBoardsService {
  constructor(
    @InjectRepository(OnlineBoards)
    private readonly onlineBoardsRepository: Repository<OnlineBoards>,
    private readonly usersService: UsersService,
  ) {}

  // 자유게시판 작성
  async createBoard(
    createOnlineBoardDto: CreateOnlineBoardDto,
    userInfo: UserInfos,
  ) {
    const { title, content } = createOnlineBoardDto;

    const foundUser = await this.usersService.findByUserId(userInfo.id);

    return await this.onlineBoardsRepository.save({
      userId: foundUser.id,
      title,
      content,
    });
  }
  // 게시판 모두/키워드만 조회
  async findAllBoard(findAllOnlineBoardDto: FindAllOnlineBoardDto) {
    const { keyword } = findAllOnlineBoardDto;
    const boards = await this.onlineBoardsRepository.find({
      where: {
        ...(keyword && { title: Like(`%${keyword}%`) }),
      },
      select: {
        id: true,
        userId: true,
        title: true,
        view: true,
        like: true,
        createdAt: true,
      },
    });

    return boards;
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
    const foundUser = await this.usersService.findByUserId(userInfo.id);
    const foundBoard = await this.findBoardId(id);

    if (foundBoard.id !== foundUser.id) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

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
    const foundUser = await this.usersService.findByUserId(userInfo.id);
    const foundBoard = await this.findBoardId(id);

    if (foundBoard.id !== foundUser.id) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    await this.onlineBoardsRepository.softDelete({ id });
    return `This action removes a #${id} onlineBoard`;
  }

  // 자유게시판 아이디 조회
  async findBoardId(id: number) {
    const foundBoard = await this.onlineBoardsRepository.findOneBy({
      id,
    });

    if (!foundBoard) {
      throw new NotFoundException('해당 게시물이 존재하지 않습니다.');
    }

    return foundBoard;
  }
}
