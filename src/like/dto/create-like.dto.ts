import {
  IsEnum,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
  isString,
} from 'class-validator';
import { BoardType } from '../../s3/board-type';

export class LikeInputDto {
  @IsEnum(BoardType)
  boardType: BoardType;
}
