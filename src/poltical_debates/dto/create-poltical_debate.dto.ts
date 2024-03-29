import { IsEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePolticalDebateDto {
  @IsEmpty({ message: '토론 타이틀을 입력해 주세요.' })
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsNumber()
  view: number;
}
