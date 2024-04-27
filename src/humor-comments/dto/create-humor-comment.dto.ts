import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateHumorCommentDto {
  @IsString()
  @MinLength(1, { message: '댓글 내용을 입력해주세요.' })
  @MaxLength(1000, { message: '내용은 1000자 이상을 넘을 수 없습니다.' })
  content: string;
}
