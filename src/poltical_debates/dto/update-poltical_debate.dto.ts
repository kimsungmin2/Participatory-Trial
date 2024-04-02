import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePolticalDebateDto {
  @ApiProperty({
    example: '여당 vs 야당',
    description: '정치 토론 게시판 타이틀 수정',
    required: false,
  })
  @IsNotEmpty({ message: '타이틀을 입력해 주세요' })
  @IsString()
  title: string;

  @ApiProperty({
    example: '누가 이길까?',
    description: '정치 토론 게시판 내용 수정',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;
}
