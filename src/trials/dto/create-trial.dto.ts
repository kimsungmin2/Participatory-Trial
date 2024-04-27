import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTrialDto {
  // 토론 제목
  @ApiProperty({
    example: '음주운전 형량.',
    description: '토론을 할 주제를 입력해주세요.',
  })
  @IsString({ message: '토론 제목은 문자열로 입력 해주세요.' })
  @IsNotEmpty({ message: '토론 제목을 입력 해주세요.' })
  title: string;

  // 토론 내용
  @ApiProperty({
    example: '음주운전 형량 이대로 괜찮은가',
    description: '토론을 할 내용을 입력해주세요.',
  })
  @IsString({ message: '토론 내용은 문자열로 입력 해주세요.' })
  @IsNotEmpty({ message: '토론 내용을 입력 해주세요.' })
  content: string;

  // 토론 내용
  @ApiProperty({
    example: '2024-05-01T15:00:00Z',
    description: '토론시간을 정해주세요',
  })
  @IsNotEmpty({ message: '토론 시간을 입력해 주세요.' })
  trialTime: Date;

  
}