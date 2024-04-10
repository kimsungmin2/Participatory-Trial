// votes.service.ts
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Votes } from '../entities/vote.entity';
import { Request } from 'express';
import { EachVote } from '../entities/Uservote.entity';
import { VoteTitleDto } from './dto/voteDto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(EachVote)
    private eachVoteRepository: Repository<EachVote>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private dataSource: DataSource,
  ) {}
  // userCode 난수 생성 함수
  private generateUserCode(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  // 유저 코드 생성 또는 조회(코드 수정 전 ver 1)
  private async findOrCreateUserCode(req: Request, userId: number | null) {
    let userCode = null;
    if (!userId) {
      userCode = req.cookies['user-code']; // 이런 쿠키가 있는지 확인
      if (!userCode) {
        userCode = this.generateUserCode();
        req.res.cookie('user-code', userCode, {
          maxAge: 900000,
          httpOnly: true,
        });
      }
    }
    return userCode;
  }
  // 유저 코드 생성 또는 조회 (리팩토링 버전(검증 속도를 위해서 redis 캐시 사용 and 유저마다 고유 ip로 저장) ver2)
  private async findOrCreateUserCodeVer2(req: Request, userId: number | null) {
    if (userId) {
      return null;
    }
    let userCode = req.cookies['user-code'];
    if (userCode) {
      return userCode;
    }
    const userKey = req.ip;
    // 레디스에서 찾기
    userCode = await this.cacheManager.get<string>(userKey);
    if (!userCode) {
      userCode = this.generateUserCode();
      await this.cacheManager.set(userKey, userCode, 1000 * 24 * 60 * 60); // 밀리초 단위임
      req.res.cookie('user-code', userCode, {
        maxAge: 1000 * 24 * 60 * 60,
        httpOnly: true,
      });
    }
    return userCode;
  }
  // 투표 중복 검증 and 투표수 업데이트 함수
  private async validationAndSaveVote(
    {
      userId,
      userCode,
      voteId,
      voteFor,
    }: { userId?: number; userCode?: string; voteId: number; voteFor: boolean },
    queryRunner: QueryRunner,
  ) {
    // 1. 이미 userId가 null이 아니면 userId를 이용해 찾고, 없으면 userCodoe를 이요해서 찾는다.
    const isExistingVote = userId
      ? await queryRunner.manager.findOneBy(EachVote, { userId, voteId })
      : await queryRunner.manager.findOneBy(EachVote, { userCode, voteId });
    // 2. 투표 있으면 에러 던지기(400번)
    if (isExistingVote) {
      throw new BadRequestException(
        '이미 투표했습니다. 재 투표는 불가능 합니다.',
      );
    }
    const voteData = this.eachVoteRepository.create({
      userId,
      userCode,
      voteId,
      voteFor,
    });
    await queryRunner.manager.save(EachVote, voteData);
  }
  // 투표하기
  async addVoteUserorNanUser(
    req: Request,
    userId: number | null,
    voteId: number,
    voteFor: boolean,
  ) {
    const userCode = await this.findOrCreateUserCodeVer2(req, userId);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await this.validationAndSaveVote(
        { userId, userCode, voteId, voteFor },
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
    const deleteResult = await this.eachVoteRepository.delete({
      id: uservoteId,
    });
    // 2. 없으면 404
    if (deleteResult.affected === 0) {
      throw new NotFoundException(
        '찾는 재판이 없습니다. 또는 이미 삭제되었습니다.',
      );
    }
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
  async getUserVoteCounts(voteId: number) {
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
      .andWhere('eachVote.userCode IS NULL')
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
}