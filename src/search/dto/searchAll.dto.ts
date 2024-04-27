import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
} from 'class-validator';

export class SearchAllQueryDto {
  @ApiProperty({
    example: '세민',
    description: '검색어를 입력해주세요.',
    required: true,
  })
  @IsString({ message: '검색어는 문자열로 입력 해주세요.' })
  @IsOptional()
  search: string;

  @ApiProperty({
    example: 'title',
    description: '검색 형식을 지정해주세요',
  })
  @IsString()
  type: string;
}
