import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VoteForDto {
  // 토론 제목
  @ApiProperty({
    example: true,
    description: '찬성하면 true 반대하면 false',
  })
  @IsNotEmpty({ message: '투표를 행사해주세요' })
  @IsBoolean({ message: '투표를 행사해주세요' })
  voteFor: boolean;
}
