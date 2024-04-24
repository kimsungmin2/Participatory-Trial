import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
export class MessageDto {
  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'voteId',
  })
  @IsNotEmpty({ message: 'voteId를 입력해주세요' })
  voteId: number;

  @IsString()
  @ApiProperty({
    example: '123456',
    description: 'message',
  })
  @IsNotEmpty({ message: 'message를 입력해주세요.' })
  chatMessage: string;
}
