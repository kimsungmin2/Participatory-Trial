import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateDto {
  @IsString()
  @ApiProperty({
    example: '123456',
    description: '비밀번호',
  })
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '김성민',
    description: '수정할 닉네임',
  })
  @IsNotEmpty({ message: '수정할 이름을 입력해주세요.' })
  nickName: string;
}
