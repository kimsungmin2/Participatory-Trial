import { ApiProperty } from '@nestjs/swagger';
import { IsEmpty, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePolticalDebateDto {
  @ApiProperty({
    example: '여당 vs 야당',
    description: '정치 토론방 타이틀',
  })
  @IsNotEmpty({ message: '토론 타이틀을 입력해 주세요.' })
  @IsString()
  title: string;

  @ApiProperty({
    example: '누가 이길까?',
    description: '정치 토론방 콘텐츠',
  })
  @IsString()
  content: string;
}
