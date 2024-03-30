// votes.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Votes } from '../entities/vote.entity';
import { Request } from 'express'
import { EachVote } from '../entities/Uservote.entity';
import { VoteDto } from './dto/voteDto';

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Votes)
    private votesRepository: Repository<Votes>,
    @InjectRepository(EachVote)
    private eachVoteRepository: Repository<EachVote>,
  ) {}

  // userCode 난수 생성 함수
  private generateUserCode(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // 유저
  private async findOrCreateUserCode(req: Request, userId: number | null) {
    let userCode = null;
    if(!userId) {
      userCode = req.cookies['user-Codes'];
      if(!userCode){
        userCode = this.generateUserCode();
        req.res.cookie('user-code', userCode, { maxAge: 900000, httpOnly: true });
      }
    }

    return userCode
  }


  // 투표 중복 검증 and 투표수 업데이트 함수
  private async validationAndSaveVote({ userId, userCode, voteId, voteFor }: { userId?:number; userCode?: string; voteId: number; voteFor: boolean }) {

    // 1. 이미 userId가 null이 아니면 userId를 이용해 찾고, 없으면 userCodoe를 이요해서 찾는다.
    const isExistingVote = userId ? await this.eachVoteRepository.findOneBy({ userId, voteId})
    : await this.eachVoteRepository.findOneBy({ userCode, voteId })

    // 2. 투표 있으면 에러 던지기
    if(isExistingVote) {
      throw new BadRequestException('이미 투표했습니다. 재 투표는 불가능 합니다.')
    }

    const voteData = this.eachVoteRepository.create({ userId, userCode, voteId, voteFor})
    await this.eachVoteRepository.save(voteData)
  }

  // 카운팅 함수
  private async updateVoteCount(voteId: number, voteFor: boolean) {
    const voteData = await this.votesRepository.findOneBy({ id: voteId});
    if(!voteData){
      throw new BadRequestException("해당 투표를 찾을 수 없습니다.")
    }

    if(voteFor) {
      voteData.voteCount1 += 1
    } else {
      voteData.voteCount2 += 1
    }
    await this.votesRepository.save(voteData);
  }

  // 투표하기
  async addVoteUserorNanUser(req: Request, userId: number | null, voteId: number, voteFor: boolean){
    const userCode = await this.findOrCreateUserCode(req, userId)
    await this.validationAndSaveVote({ userId, userCode, voteId, voteFor});
    await this.updateVoteCount(voteId, voteFor)

      return { VoteOk: true}
  }
}
