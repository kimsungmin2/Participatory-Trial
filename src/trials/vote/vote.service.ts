import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Votes } from '../entities/vote.entity';
import { Request } from 'express';
import { EachVote } from '../entities/Uservote.entity';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(EachVote)
    private eachVoteRepository: Repository<EachVote>,
    private dataSource: DataSource,
  ) {}

  // 투표 중복 검증 and 투표수 업데이트 함수
  async validationAndSaveVote(
    {
      userId,
      ip,
      voteId,
      voteFor,
    }: {
      userId?: number;
      ip?: string;
      voteId: number;
      voteFor: boolean;
    },
    queryRunner: QueryRunner,
  ) {
    // 1. 이미 userId가 null이 아니면 userId를 이용해 찾고, 없으면 userCodoe를 이요해서 찾는다.
    const isExistingVote = userId
      ? await queryRunner.manager.findOneBy(EachVote, { userId, voteId })
      : await queryRunner.manager.findOneBy(EachVote, { ip, voteId });

    // 2. 투표 있으면 에러 던지기(400번)
    if (isExistingVote) {
      if (isExistingVote.voteFor === voteFor) {
        const vote = await this.canselEachVote(isExistingVote.id);
        return vote;
      } else {
        isExistingVote.voteFor = voteFor;
        await queryRunner.manager.save(EachVote, isExistingVote);
        return isExistingVote;
      }
    }
    const voteData = this.eachVoteRepository.create({
      userId,
      ip,
      voteId,
      voteFor,
    });
    await queryRunner.manager.save(EachVote, voteData);
  }
  // 투표하기
  async addVoteUserorNanUser(
    ip: string,
    userId: number | null,
    voteId: number,
    voteFor: boolean,
  ) {
    // const userCode = await this.findOrCreateUserCodeVer2(req, userId);
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();
    try {
      await this.validationAndSaveVote(
        { userId, ip, voteId, voteFor },
        queryRunner,
      );
      // await this.updateVoteCount(voteId, voteFor, queryRunner);
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
    const deleteResult = await this.eachVoteRepository.delete({
      id: uservoteId,
    });
    // 2. 없으면 404
    // if (deleteResult.affected === 0) {
    //   throw new NotFoundException(
    //     '찾는 재판이 없습니다. 또는 이미 삭제되었습니다.',
    //   );
    // }
    return deleteResult;
  }
  // 투표 했는지 검사 (isvoteGuard에서 사용함)
  async checkIsUserVoteGuard(userVoteId: number, userId: number) {
    return await this.eachVoteRepository.findOne({
      where: {
        id: userVoteId,
        userId: userId,
      },
    });
  }
  async getUserVoteCounts(voteId: number): Promise<{
    vote1Percentage: string;
    vote2Percentage: string;
    totalVotes: number;
  }> {
    const result = await this.dataSource
      .getRepository(EachVote)
      .createQueryBuilder('eachVote')
      .select(
        'SUM(CASE WHEN eachVote.voteFor = true THEN 1 ELSE 0 END)',
        'voteForTrue',
      )
      .addSelect(
        'SUM(CASE WHEN eachVote.voteFor = false THEN 1 ELSE 0 END)',
        'voteForFalse',
      )
      .where('eachVote.voteId = :voteId', { voteId })
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
  async getVoteCounts(voteId: number) {
    const result = await this.dataSource
      .getRepository(EachVote)
      .createQueryBuilder('eachVote')
      .select(
        'SUM(CASE WHEN eachVote.voteFor = true THEN 1 ELSE 0 END)',
        'voteForTrue',
      )
      .addSelect(
        'SUM(CASE WHEN eachVote.voteFor = false THEN 1 ELSE 0 END)',
        'voteForFalse',
      )
      .where('eachVote.voteId = :voteId', { voteId })
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

  async updateVoteCounts(voteId: number) {
    const result = await this.dataSource
      .getRepository(EachVote)
      .createQueryBuilder('eachVote')
      .select(
        'SUM(CASE WHEN eachVote.voteFor = true THEN 1 ELSE 0 END)',
        'voteCount1',
      )
      .addSelect(
        'SUM(CASE WHEN eachVote.voteFor = false THEN 1 ELSE 0 END)',
        'voteCount2',
      )
      .where('eachVote.voteId = :voteId', { voteId })
      .getRawOne();
    const voteCount1 = parseInt(result.voteCount1, 10);
    const voteCount2 = parseInt(result.voteCount2, 10);
    await this.dataSource
      .getRepository(Votes)
      .createQueryBuilder()
      .update(Votes)
      .set({ voteCount1: voteCount1, voteCount2: voteCount2 })
      .where('id = :voteId', { voteId })
      .execute();
  }
}
