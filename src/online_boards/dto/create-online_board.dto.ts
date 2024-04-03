import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateOnlineBoardDto {
  @IsString()
  @IsNotEmpty({ message: '제목이 비어있습니다.' })
  @MaxLength(30, { message: '제목은 30자 이내로 작성해주세요.' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '내용이 비어있습니다.' })
  content: string;
}
