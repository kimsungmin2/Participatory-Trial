import { Injectable } from '@nestjs/common';
import { CreateOnlineBoardDto } from './dto/create-online_board.dto';
import { UpdateOnlineBoardDto } from './dto/update-online_board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OnlineBoards } from './entities/online_board.entity';
import { Like, Repository } from 'typeorm';
import { FindAllOnlineBoardDto } from './dto/findAll-online_board.dto';

@Injectable()
export class OnlineBoardsService {
  constructor(
    @InjectRepository(OnlineBoards)
    private readonly onlineBoardsRepository: Repository<OnlineBoards>,
  ) {}
  async createBoard(createOnlineBoardDto: CreateOnlineBoardDto) {
    const { title, content } = createOnlineBoardDto;

    return await this.onlineBoardsRepository.save({ title, content });
  }

  async findAllBoard(findAllOnlineBoardDto: FindAllOnlineBoardDto) {
    const { keyword } = findAllOnlineBoardDto;
    const shows = await this.onlineBoardsRepository.find({
      where: {
        ...(keyword && { title: Like(`%${keyword}%`) }),
      },
    });

    return shows;
  }

  async findBoard(id: number) {
    const board = await this.onlineBoardsRepository.findOne({
      where: { id },
      relations: { OnlineBoardComment: true },
    });
    return board;
  }

  async updateBoard(id: number, updateOnlineBoardDto: UpdateOnlineBoardDto) {
    const { title, content } = updateOnlineBoardDto;
    const board = await this.onlineBoardsRepository.save({
      id,
      title,
      content,
    });
    return board;
  }

  async removeBoard(id: number) {
    await this.onlineBoardsRepository.softDelete({ id });
    return `This action removes a #${id} onlineBoard`;
  }
}
