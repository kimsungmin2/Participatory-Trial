import { Injectable, NotFoundException } from '@nestjs/common';
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
  async updateBoard(id: number, updateOnlineBoardDto: UpdateOnlineBoardDto) {
    const foundBoard = await this.findBoardId(id);

    const { title, content } = updateOnlineBoardDto;
    const board = await this.onlineBoardsRepository.save({
      id: foundBoard.id,
      title,
      content,
    });

    return board;
  }

  // 자유게시판 삭제
  async removeBoard(id: number) {
    const foundBoard = await this.findBoardId(id);

    await this.onlineBoardsRepository.softDelete({ id: foundBoard.id });

    return `This action removes a #${id} onlineBoard`;
  }

  // 자유게시판 아이디 조회
  async findBoardId(boardId: number) {
    // console.log('boardId: ', boardId);
    const foundBoard = await this.onlineBoardsRepository.findOne({
      where: { id: boardId },
    });

    if (!foundBoard) {
      throw new NotFoundException('해당 게시물이 존재하지 않습니다.');
    }

    return foundBoard;
  }

  async verifyBoardOwner(userId: number, boardId: number) {
    return await this.onlineBoardsRepository.findOne({
      where: { userId, id: boardId },
    });
  }
}
