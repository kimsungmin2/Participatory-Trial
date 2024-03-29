import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePolticalDebateCommentDto {
  @IsNotEmpty({ message: '댓글내용을 입력해 주세요.' })
  @IsString()
  content: string;
}
