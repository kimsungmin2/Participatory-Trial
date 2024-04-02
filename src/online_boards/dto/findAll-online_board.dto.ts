import { IsOptional, IsString } from 'class-validator';

export class FindAllOnlineBoardDto {
  @IsOptional()
  @IsString()
  keyword?: string;
}
