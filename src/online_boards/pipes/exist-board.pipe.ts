import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { OnlineBoardsService } from '../online_boards.service';

@Injectable()
export class BoardIdValidationPipe implements PipeTransform {
  constructor(private readonly onlineBoardsService: OnlineBoardsService) {}

  async transform(value: number) {
    const board = await this.onlineBoardsService.findBoardId(value); // 이거시 온라인 보드 서비스 메서드!
    if (!board) {
      throw new NotFoundException(`Board with ID ${value} not found`);
    }
    return value;
  }
}
