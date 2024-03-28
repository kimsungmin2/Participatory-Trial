import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
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
  password: string | null;
}
