import { Injectable } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { HumorBoards } from './entities/humor-board.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class HumorSeedService {
  constructor(
    @InjectRepository(HumorBoards)
    private humorBoardRepository: Repository<HumorBoards>,
  ) {}
  generateRandomHumorBoards(count: number) {
    const humorBoards = [];
    for (let i = 0; i < count; i++) {
      const humorBoard = {
        userId: 1,
        title: faker.lorem.words(5),
        content: faker.lorem.words(5),
        like: faker.number.int({ min: 0, max: 1000 }),
        view: faker.number.int({ min: 0, max: 10000 }),
      };
      humorBoards.push(humorBoard);
      console.log(humorBoard);
    }
    return humorBoards;
  }

  async saveHumorToDataBase(count: number): Promise<void> {
    const humorBoards = this.generateRandomHumorBoards(count);
    await this.humorBoardRepository.save(humorBoards);
  }
}
