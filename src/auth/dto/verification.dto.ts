import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class VerifiCation {
  @IsEmail()
  @ApiProperty({
    example: 'song123@gmail.com',
    description: '이메일',
  })
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  email: string;

  @IsNumber()
  @ApiProperty({
    example: 123456,
    description: '인증번호',
  })
  @IsNotEmpty({ message: '이메일 인증번호를 입력해주세요.' })
  code: number;
}
