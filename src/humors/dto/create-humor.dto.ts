import { IsString, MaxLength, MinLength} from 'class-validator';

export class CreateHumorBoardDto {
  @IsString({ message: '제목을 입력해주세요.' })
  @MinLength(1, { message: '최소 1자 이상 적어야합니다.' })
  @MaxLength(50, { message: '제목은 50자를 넘을 수 없습니다.' })
  title: string;

  @IsString({ message: '내용을 입력해주세요' })
  @MinLength(1, { message: '최소 1자 이상 적어야합니다.' })
  @MaxLength(100000, { message: '내용은 1000자 이상을 넘을 수 없습니다.' })
  content: string;
}
