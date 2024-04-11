import { PartialType } from '@nestjs/mapped-types';
import { CreateOnlineBoardCommentDto } from './create-online_board_comment.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateOnlineBoardCommentDto extends PartialType(
  CreateOnlineBoardCommentDto,
) {
  @IsString()
  @IsNotEmpty({ message: '내용을 작성해주세요.' })
  content: string;
}
