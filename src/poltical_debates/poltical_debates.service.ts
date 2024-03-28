import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PolticalDebateBoards } from 'src/poltical_debates/entities/poltical_debate.entity';
import { Repository } from 'typeorm';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';
import { UpdatePolticalDebateDto } from './dto/update-poltical_debate.dto';

@Injectable()
export class PolticalDebatesService {
  constructor(
    @InjectRepository(PolticalDebateBoards)
    private readonly polticalDebateRepository: Repository<PolticalDebateBoards>,
  ) {}
  create(createPolticalDebateDto: CreatePolticalDebateDto) {
    const poltical_debate_board = this.polticalDebateRepository.save({
      ...createPolticalDebateDto,
    });
    return poltical_debate_board;
  }

  async findAll() {
    const find_all_poltical_debate_board =
      await this.polticalDebateRepository.find();

    return find_all_poltical_debate_board;
  }

  // async MyfindAll(id: number) {
  //   const my_poltical_debate_board = await this.polticalDebateRepository.find({
  //     where: { userId },
  //   });
  //   return my_poltical_debate_board;
  // }

  async findOne(id: number) {
    const find_one_poltical_debate_board =
      await this.polticalDebateRepository.findOne({
        where: { id },
      });

    if (!find_one_poltical_debate_board) {
      throw new BadRequestException('존재하지 않는 정치 토론방입니다.');
    }

    return find_one_poltical_debate_board;
  }

  async myfindOne(userId: number, id: number) {
    const my_find_one_poltical_debate_board =
      await this.polticalDebateRepository.findOne({
        where: { id, userId },
      });

    if (!my_find_one_poltical_debate_board) {
      throw new BadRequestException('존재하지 않는 정치 토론방입니다.');
    }

    return my_find_one_poltical_debate_board;
  }

  async update(
    userId: number,
    id: number,
    createPolticalDebateDto: CreatePolticalDebateDto,
  ) {
    const update_poltical_debate = await this.polticalDebateRepository.findOne({
      where: { id: userId },
    });

    if (!update_poltical_debate)
      throw new BadRequestException('존재하지 않는 정치 토론방입니다.');

    const updateBoard = await this.polticalDebateRepository.update(
      { id },
      createPolticalDebateDto,
    );
    return updateBoard;
  }

  remove(id: number) {
    return `This action removes a #${id} polticalDebate`;
  }
}
