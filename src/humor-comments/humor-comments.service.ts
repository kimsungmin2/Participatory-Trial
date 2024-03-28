import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHumorCommentDto } from './dto/create-humor-comment.dto';
import { UpdateHumorCommentDto } from './dto/update-humor-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { HumorComments } from './entities/humor_comment.entity';
import { Repository } from 'typeorm';
import { HumorBoards } from '../humors/entities/humor-board.entity';

@Injectable()
export class HumorCommentsService {
  constructor(
    @InjectRepository(HumorComments)
    private humorCommentRepository: Repository<HumorComments>,
    @InjectRepository(HumorBoards)
    private humorBoardRepository: Repository<HumorBoards>,
  ) {}
  async createComment(
    createHumorCommentDto: CreateHumorCommentDto,
    boardId: number,
  ) {
    const findHumorBoard = await this.humorBoardRepository.findOneBy({
      id: boardId,
    });
    if (!findHumorBoard)
      throw new NotFoundException(`${boardId}번 게시물을 찾을 수 없습니다.`);

    const createdComment = await this.humorCommentRepository.save({
      humorBoardId: boardId,
      ...createHumorCommentDto,
    });
  }

  async findAll() {
    return `This action returns all humorComments`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} humorComment`;
  }

  async update(id: number, updateHumorCommentDto: UpdateHumorCommentDto) {
    return `This action updates a #${id} humorComment`;
  }

  async remove(id: number) {
    return `This action removes a #${id} humorComment`;
  }
}
