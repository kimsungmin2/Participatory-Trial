import { Injectable } from '@nestjs/common';
import { CreateHumorDto } from './dto/create-humor.dto';
import { UpdateHumorDto } from './dto/update-humor.dto';

@Injectable()
export class HumorsService {
  create(createHumorDto: CreateHumorDto) {
    return 'This action adds a new humor';
  }

  findAll() {
    return `This action returns all humors`;
  }

  findOne(id: number) {
    return `This action returns a #${id} humor`;
  }

  update(id: number, updateHumorDto: UpdateHumorDto) {
    return `This action updates a #${id} humor`;
  }

  remove(id: number) {
    return `This action removes a #${id} humor`;
  }
}
