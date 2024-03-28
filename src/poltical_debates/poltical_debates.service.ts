import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PolticalDebateBoards } from 'src/poltical_debates/entities/poltical_debate.entity';
import { Repository } from 'typeorm';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';
import { UpdatePolticalDebateDto } from './dto/update-poltical_debate.dto';

@Injectable()
export class PolticalDebatesService {
  constructor(
    @InjectRepository(PolticalDebateBoards)
    private readonly polticalDebateBoards: Repository<PolticalDebateBoards>,
  ) {}
  create(createPolticalDebateDto: CreatePolticalDebateDto) {
    const poltical_debate_board = this.polticalDebateBoards.save({
      ...createPolticalDebateDto,
    });
    return poltical_debate_board;
  }

  findAll() {
    return `This action returns all polticalDebates`;
  }

  findOne(id: number) {
    return `This action returns a #${id} polticalDebate`;
  }

  update(id: number, updatePolticalDebateDto: UpdatePolticalDebateDto) {
    return `This action updates a #${id} polticalDebate`;
  }

  remove(id: number) {
    return `This action removes a #${id} polticalDebate`;
  }
}
