import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BoardIndex } from '../type/board_index.type';

export class SearchQueryDto {
  // 제목 쿼리
  @ApiProperty({
    example: '세민',
    description: '검색어를 입력해주세요.',
    required: true,
  })
  @IsString({ message: '검색어는 문자열로 입력 해주세요.' })
  @IsOptional()
  search: string;

  // 토론 내용
  @ApiProperty({
    example: 'humor_board',
    description: '게시판 인덱스를 지정해주세요',
    required: true,
  })
  // @IsEnum(BoardIndex)
  @IsString()
  boardName?: string;

  @ApiProperty({
    example: 'title',
    description: '검색 형식을 지정해주세요',
  })
  // @IsEnum(BoardIndex)
  @IsString()
  type: string;
}
//http://localhost:3000/search?search=%E3%84%B9%E3%85%88%E3%85%81&type=title&boardName=humor
