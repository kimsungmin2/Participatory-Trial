import {
  IsEnum,
} from 'class-validator';
import { BoardType } from '../../s3/type/board-type';

export class LikeInputDto {
  @IsEnum(BoardType)
  boardType: BoardType;
}
