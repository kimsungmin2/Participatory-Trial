import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class PaginateQueryDto {
  @Min(1, { message: '페이지 번호는 1 이상이어야 합니다.' })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @Min(1, { message: '한 페이지당 게시물 수는 1 이상이어야 합니다.' })
  @Max(100, { message: '한 페이지당 게시물 수는 100 이하이어야 합니다.' })
  @IsOptional()
  @IsNumber()
  pageSize?: number = 10;
}
