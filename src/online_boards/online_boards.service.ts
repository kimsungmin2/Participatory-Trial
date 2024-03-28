import { Injectable } from '@nestjs/common';
import { CreateOnlineBoardDto } from './dto/create-online_board.dto';
import { UpdateOnlineBoardDto } from './dto/update-online_board.dto';

@Injectable()
export class OnlineBoardsService {
  create(createOnlineBoardDto: CreateOnlineBoardDto) {
    return 'This action adds a new onlineBoard';
  }

  findAll() {
    return `This action returns all onlineBoards`;
  }

  findOne(id: number) {
    return `This action returns a #${id} onlineBoard`;
  }

  update(id: number, updateOnlineBoardDto: UpdateOnlineBoardDto) {
    return `This action updates a #${id} onlineBoard`;
  }

  remove(id: number) {
    return `This action removes a #${id} onlineBoard`;
  }
}
