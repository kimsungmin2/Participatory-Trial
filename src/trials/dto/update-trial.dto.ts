import { PartialType } from '@nestjs/mapped-types';
import { CreateTrialDto } from './create-trial.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateTrialDto extends PartialType(CreateTrialDto) {

    // 토론 제목
    @ApiProperty({
        example: "음주운전 형량.",
        description:"토론을 할 주제를 입력해주세요."
    })
    @IsOptional()
    @IsNotEmpty({ message: '토론 제목을 입력 해주세요.'})
    @IsString({ message: '토론 제목은 문자열로 입력 해주세요.'})
    title?: string;


    // 토론 내용
    @ApiProperty({
        example: "음주운전 형량 늘려야 한다. vs 지금도 충분하다.",
        description:"토론을 할 주제를 vs 형식으로 만들어 주세요."
    })
    @IsOptional()
    @IsString({ message: '토론 내용은 문자열로 입력 해주세요.'})
    @IsNotEmpty({ message: '토론 내용을 입력 해주세요.'})
    content?: string;
}





