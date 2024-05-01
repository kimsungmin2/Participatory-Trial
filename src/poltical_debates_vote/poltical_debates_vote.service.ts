// votes.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Request } from 'express';
import { EachPolticalVote } from '../poltical_debates/entities/userVoteOfPoltical_debate.entity';
import { PolticalDebateVotes } from '../poltical_debates/entities/polticalVote.entity';
@Injectable()
export class PolticalVotesService {
  constructor(
    @InjectRepository(EachPolticalVote)
    private eachPolticalVoteRepository: Repository<EachPolticalVote>,
    private dataSource: DataSource,
  ) {}

  async validationAndSaveVote(
    {
      userId,
      ip,
      polticalVoteId,
      voteFor,
    }: {
      userId?: number;
      ip?: string;
      polticalVoteId: number;
      voteFor: boolean;
    },
    queryRunner: QueryRunner,
  ) {
    // 1. 이미 userId가 null이 아니면 userId를 이용해 찾고, 없으면 userCodoe를 이요해서 찾는다.
    const isExistingVote = userId
      ? await queryRunner.manager.findOneBy(EachPolticalVote, {
          userId,
          polticalVoteId,
        })
      : await queryRunner.manager.findOneBy(EachPolticalVote, {
          ip,
          polticalVoteId,
        });

    // 2. 투표 있으면 에러 던지기(400번)
    if (isExistingVote) {
      if (isExistingVote.voteFor === voteFor) {
        const vote = await this.canselEachVote(isExistingVote.id);
        return vote;
      } else {
        isExistingVote.voteFor = voteFor;
        await queryRunner.manager.save(EachPolticalVote, isExistingVote);
        return isExistingVote;
      }
    }

    const voteData = this.eachPolticalVoteRepository.create({
      userId,
      ip,
      polticalVoteId,
      voteFor,
    });
    await queryRunner.manager.save(EachPolticalVote, voteData);
  }
  // 투표하기
  async addPolticalVoteUserorNanUser(
    ip: string,
    userId: number | null,
    polticalVoteId: number,
    voteFor: boolean,
  ) {
    // const userCode = await this.findOrCreateUserCodeVer2(req, userId);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await this.validationAndSaveVote(
        { userId, ip, polticalVoteId, voteFor },
        queryRunner,
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
    return { VoteOk: true };
  }
  // 투표 삭제 매서드
  async canselEachVote(uservoteId: number) {
    // 1. 재판 삭제(일반적으로 remove보다 delete가 더 빠르다.)
    const deleteResult = await this.eachPolticalVoteRepository.delete({
      id: uservoteId,
    });
    // 2. 없으면 404

    return deleteResult;
  }
  // 투표 했는지 검사 (isvoteGuard에서 사용함)
  async checkIsUserVoteGuard(userVoteId: number, userId: number) {
    return await this.eachPolticalVoteRepository.findOne({
      where: {
        id: userVoteId,
        userId: userId,
      },
    });
  }
  async getUserVoteCounts(polticalVoteId: number) {
    const result = await this.dataSource
      .getRepository(EachPolticalVote)
      .createQueryBuilder('eachPolticalVote')
      .select(
        'SUM(CASE WHEN eachPolticalVote.voteFor = true THEN 1 ELSE 0 END)',
        'voteForTrue',
      )
      .addSelect(
        'SUM(CASE WHEN eachPolticalVote.voteFor = false THEN 1 ELSE 0 END)',
        'voteForFalse',
      )
      .where('eachPolticalVote.polticalVoteId = :polticalVoteId', {
        polticalVoteId,
      })
      .getRawOne();

    const voteForTrue = parseInt(result.voteForTrue, 10);
    const voteForFalse = parseInt(result.voteForFalse, 10);

    const totalVotes = voteForTrue + voteForFalse;

    const vote1Percentage =
      totalVotes > 0 ? (voteForTrue / totalVotes) * 100 : 0;
    const vote2Percentage =
      totalVotes > 0 ? (voteForFalse / totalVotes) * 100 : 0;

    return {
      vote1Percentage: `${vote1Percentage.toFixed(2)}%`,
      vote2Percentage: `${vote2Percentage.toFixed(2)}%`,
      totalVotes: totalVotes,
    };
  }
  async getVoteCounts(polticalVoteId: number) {
    const result = await this.dataSource
      .getRepository(EachPolticalVote)
      .createQueryBuilder('eachPolticalVote')
      .select(
        'SUM(CASE WHEN eachPolticalVote.voteFor = true THEN 1 ELSE 0 END)',
        'voteForTrue',
      )
      .addSelect(
        'SUM(CASE WHEN eachPolticalVote.voteFor = false THEN 1 ELSE 0 END)',
        'voteForFalse',
      )
      .where('eachPolticalVote.polticalVoteId = :polticalVoteId', {
        polticalVoteId,
      })
      .getRawOne();
    const voteForTrue = parseInt(result.voteForTrue, 10);
    const voteForFalse = parseInt(result.voteForFalse, 10);
    const totalVotes = voteForTrue + voteForFalse;
    const vote1Percentage =
      totalVotes > 0 ? (voteForTrue / totalVotes) * 100 : 0;
    const vote2Percentage =
      totalVotes > 0 ? (voteForFalse / totalVotes) * 100 : 0;
    return {
      vote1Percentage: `${vote1Percentage.toFixed(2)}%`,
      vote2Percentage: `${vote2Percentage.toFixed(2)}%`,
    };
  }

  async updateVoteCounts(polticalVoteId: number) {
    const result = await this.dataSource
      .getRepository(EachPolticalVote)
      .createQueryBuilder('eachPolticalVote')
      .select(
        'SUM(CASE WHEN eachPolticalVote.voteFor = true THEN 1 ELSE 0 END)',
        'voteCount1',
      )
      .addSelect(
        'SUM(CASE WHEN eachPolticalVote.voteFor = false THEN 1 ELSE 0 END)',
        'voteCount2',
      )
      .where('eachPolticalVote.polticalVoteId = :polticalVoteId', {
        polticalVoteId,
      })
      .getRawOne();

    const voteCount1 = parseInt(result.voteCount1, 10);
    const voteCount2 = parseInt(result.voteCount2, 10);

    await this.dataSource
      .getRepository(PolticalDebateVotes)
      .createQueryBuilder()
      .update(PolticalDebateVotes)
      .set({ voteCount1: voteCount1, voteCount2: voteCount2 })
      .where('id = :polticalVoteId', { polticalVoteId })
      .execute();
  }
}
