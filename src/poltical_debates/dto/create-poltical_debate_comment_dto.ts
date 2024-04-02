import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePolticalDebateCommentDto {
  @ApiProperty({
    example: '댓글 입력',
    description: '댓글 내용',
  })
  @IsNotEmpty({ message: '댓글 내용을 입력해 주세요.' })
  @IsString()
  content: string;
}
