import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  @ApiProperty({
    example: 'song123@gmail.com',
    description: '이메일',
  })
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  email: string;

  @IsString()
  @ApiProperty({
    example: '123456',
    description: '비밀번호',
  })
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  password: string;

  @IsString()
  @ApiProperty({
    example: '123456',
    description: '비밀번호 체크',
  })
  @IsNotEmpty({ message: '체크 비밀번호를 입력해주세요.' })
  passwordConfirm: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '김성민',
    description: '이름',
  })
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  nickName: string;
}
