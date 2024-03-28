import { Injectable } from '@nestjs/common';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';
import { UpdatePolticalDebateDto } from './dto/update-poltical_debate.dto';

@Injectable()
export class PolticalDebatesService {
  create(createPolticalDebateDto: CreatePolticalDebateDto) {
    return 'This action adds a new polticalDebate';
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
