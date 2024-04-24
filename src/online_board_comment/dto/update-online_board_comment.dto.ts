import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateOnlineBoardCommentDto } from './create-online_board_comment.dto';

export class UpdateOnlineBoardCommentDto extends PartialType(
  CreateOnlineBoardCommentDto,
) {
  @IsString()
  @IsNotEmpty({ message: '내용을 작성해주세요.' })
  content: string;
}
