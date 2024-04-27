// votes.service.ts
import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Request } from 'express';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { EachHumorVote } from './entities/UservoteOfHumorVote.entity';

@Injectable()
export class HumorVotesService {
  constructor(
    @InjectRepository(EachHumorVote)
    private eachHumorVoteRepository: Repository<EachHumorVote>,
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
      ip,
      humorVoteId,
      voteFor,
    }: {
      userId?: number;
      ip?: string;
      humorVoteId: number;
      voteFor: boolean;
    },
    queryRunner: QueryRunner,
  ) {
    // 1. 이미 userId가 null이 아니면 userId를 이용해 찾고, 없으면 userCodoe를 이요해서 찾는다.
    const isExistingVote = userId
      ? await queryRunner.manager.findOneBy(EachHumorVote, {
          userId,
          humorVoteId,
        })
      : await queryRunner.manager.findOneBy(EachHumorVote, {
          ip,
          humorVoteId,
        });

    // 2. 투표 있으면 에러 던지기(400번)
    if (isExistingVote) {
      if (isExistingVote.voteFor === voteFor) {
        const vote = await this.canselEachVote(isExistingVote.id);
        return vote;
      } else {
        isExistingVote.voteFor = voteFor;
        await queryRunner.manager.save(EachHumorVote, isExistingVote);
        return isExistingVote;
      }
    }
    const voteData = this.eachHumorVoteRepository.create({
      userId,
      ip,
      humorVoteId,
      voteFor,
    });
    await queryRunner.manager.save(EachHumorVote, voteData);
  }

  // 투표하기
  async addHumorVoteUserorNanUser(
    userId: number,
    humorVoteId: number,
    voteFor: boolean,
  ) {
    // const userCode = await this.findOrCreateUserCodeVer2(req, userId);
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();
    try {
      await this.validationAndSaveVote(
        { userId, humorVoteId, voteFor },
        queryRunner,
      );
      await queryRunner.commitTransaction();
    } catch (err) {
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
    const deleteResult = await this.eachHumorVoteRepository.delete({
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
    return await this.eachHumorVoteRepository.findOne({
      where: {
        id: userVoteId,
        userId: userId,
      },
    });
  }
  async getUserVoteCounts(humorVoteId: number) {
    const result = await this.dataSource
      .getRepository(EachHumorVote)
      .createQueryBuilder('eachHumorVote')
      .select(
        'SUM(CASE WHEN eachHumorVote.voteFor = true THEN 1 ELSE 0 END)',
        'voteForTrue',
      )
      .addSelect(
        'SUM(CASE WHEN eachHumorVote.voteFor = false THEN 1 ELSE 0 END)',
        'voteForFalse',
      )
      .where('eachHumorVote.humorVoteId = :humorVoteId', { humorVoteId })
      .andWhere('eachHumorVote.userCode IS NULL')
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

  async getVoteCounts(humorVoteId: number) {
    const result = await this.dataSource
      .getRepository(EachHumorVote)
      .createQueryBuilder('eachHumorVote')
      .select(
        'SUM(CASE WHEN eachHumorVote.voteFor = true THEN 1 ELSE 0 END)',
        'voteForTrue',
      )
      .addSelect(
        'SUM(CASE WHEN eachHumorVote.voteFor = false THEN 1 ELSE 0 END)',
        'voteForFalse',
      )
      .where('eachHumorVote.humorVoteId = :humorVoteId', { humorVoteId })
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
