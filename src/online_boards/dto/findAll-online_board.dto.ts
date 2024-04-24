import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FindAllOnlineBoardDto {
  @ApiProperty({
    example: '은가누',
    description: '자유 게시판 검색을 할 검색어를 입력해주세요.',
  })
  @IsOptional()
  @IsNotEmpty({ message: '검색어를 입력 해주세요.'})
  @IsString({ message: '검색어는문자열로 입력 해주세요.'})
  keyword?: string;
}
