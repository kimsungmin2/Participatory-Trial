import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BoardIndex } from '../type/board_index.type';

export class SearchQueryDto {
  // 제목 쿼리
  @ApiProperty({
    example: '세민이햄',
    description: '검색어를 입력해주세요.',
    required: false,
  })
  @IsString({ message: '제목은 문자열로 입력 해주세요.' })
  @IsOptional()
  titleQuery?: string;

  // 내용 쿼리
  @ApiProperty({
    example: '음주운전 형량 이대로 괜찮은가',
    description: '토론을 할 내용을 입력해주세요.',
    required: false,
  })
  @IsString({ message: '내용은 문자열로 입력 해주세요.' })
  @IsOptional()
  contentQuery?: string;

  // 토론 내용
  @ApiProperty({
    example: 'humor_board',
    description: '게시판 인덱스를 지정해주세요',
  })
  // @IsEnum(BoardIndex)
  @IsString()
  boardName?: string;
}
