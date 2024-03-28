import { Injectable } from '@nestjs/common';
import { CreateOnlineBoardCommentDto } from './dto/create-online_board_comment.dto';
import { UpdateOnlineBoardCommentDto } from './dto/update-online_board_comment.dto';

@Injectable()
export class OnlineBoardCommentService {
  create(createOnlineBoardCommentDto: CreateOnlineBoardCommentDto) {
    return 'This action adds a new onlineBoardComment';
  }

  findAll() {
    return `This action returns all onlineBoardComment`;
  }

  findOne(id: number) {
    return `This action returns a #${id} onlineBoardComment`;
  }

  update(id: number, updateOnlineBoardCommentDto: UpdateOnlineBoardCommentDto) {
    return `This action updates a #${id} onlineBoardComment`;
  }

  remove(id: number) {
    return `This action removes a #${id} onlineBoardComment`;
  }
}
