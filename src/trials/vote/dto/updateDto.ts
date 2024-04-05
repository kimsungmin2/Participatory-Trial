import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { VoteTrialDto } from './voteDto';

export class UpdateVoteDto extends PartialType(VoteTrialDto) {

    // 토론 제목
    @ApiProperty({
        example: "음주운전 형량 늘려야 한다.",
        description:"찬성측"
    })
    @IsString({ message: '찬성 주장은 문자열로 입력 해주세요.'})
    @IsNotEmpty({ message: '찬성 주장을 입력 해주세요.'})
    title1?: string;


    // 토론 내용
    @ApiProperty({
        example: "지금도 충분하다.",
        description:"반대측"
    })
    @IsString({ message: '찬성 주장은 문자열로 입력 해주세요.'})
    @IsNotEmpty({ message: '찬성 주장을 입력 해주세요.'})
    title2?: string;
}




