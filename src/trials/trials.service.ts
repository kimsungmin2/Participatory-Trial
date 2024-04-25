import {
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTrialDto } from './dto/create-trial.dto';
import { UpdateTrialDto } from './dto/update-trial.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Trials } from './entities/trial.entity';
import { Between, DataSource, Like, Repository, getRepository } from 'typeorm';
import { firstValueFrom, map, retry } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { PanryeInfo } from './entities/panryedata.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Votes } from './entities/vote.entity';
import { VoteTitleDto } from './vote/dto/voteDto';
import { UpdateVoteDto } from './vote/dto/updateDto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TrialHallOfFames } from './entities/trial_hall_of_fame.entity';
import { TrialLikeHallOfFames } from './entities/trail_hall_of_fame.like.entity';
import { TrialViewHallOfFames } from './entities/trial_hall_of_fame.view.entity';
import { PaginationQueryDto } from '../humors/dto/get-humorBoard.dto';

@Injectable()
export class TrialsService {
  constructor(
    @InjectRepository(Trials)
    private trialsRepository: Repository<Trials>,
    @InjectRepository(PanryeInfo)
    private panryeRepository: Repository<PanryeInfo>,
    @InjectRepository(Votes)
    private votesRepository: Repository<Votes>,
    @InjectRepository(TrialHallOfFames)
    private trialHallOfFamesRepository: Repository<TrialHallOfFames>,
    private dataSource: DataSource,
    private httpService: HttpService,
    @InjectQueue('trial-queue') private trialQueue: Queue,
  ) {}
  // 재판 생성
  /**
   *
   * @param userId 유저 번호
   * @param createTrialDto 제목, 컨텐츠 받아오는 Dto
   * @param voteTrialDto title1 vs title 하는 Dto
   * @returns
   */
  async createTrial(
    userId: number,
    createTrialDto: CreateTrialDto,
    voteTitleDto: VoteTitleDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 1. Dto에서 title, content 뽑아내기
      const { title, content, trialTime } = createTrialDto;
      const { title1, title2 } = voteTitleDto;

      // 2. 객체에 넣기
      const data = {
        title,
        content,
        userId,
        is_time_over: false,
      };
      // 3. 재판 생성
      const newTrial = queryRunner.manager.create(Trials, data);
      // 4. 재판 저장
      const savedTrial = await queryRunner.manager.save(Trials, newTrial);
      const trialId = savedTrial.id;
      const vote = {
        title1,
        title2,
        trialId,
      };
      const newVote = queryRunner.manager.create(Votes, vote);
      const savedVote = await queryRunner.manager.save(Votes, newVote);
      const trialDate = new Date(trialTime);
      // 5. 불 큐로 지연시간 후 찍어줌
      const delay = trialDate.getTime() - Date.now();
      // 6. 제한 시간끝나면 불큐로 비동기 처리
      await this.trialQueue.add(
        'updateTimeDone',
        { trialId: savedTrial.id },
        { delay: delay },
      );
      // 7. 트랜 잭션 종료
      await queryRunner.commitTransaction();
      return { savedTrial, savedVote };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log('재판 생성 에러:', error);
      throw new InternalServerErrorException(
        '재판 생성 중 오류가 발생했습니다.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  // 유저Id로 모든 재판 찾기 매서드(유저 내 재판 조회)
  async findByUserTrials(userId: number) {
    // 1. 해당 유저의 재판이 있는지 확인
    const trials = await this.trialsRepository.findOneBy({ userId });

    // 2. 없으면 404
    if (!trials) {
      throw new NotFoundException('해당 유저의 재판이 없습니다.');
    }

    // 3. 있으면 리턴
    return trials;
  }

  // 모든 재판 조회 매서드(유저/비회원 구분 X)
  async findAllTrials(paginationQueryDto: PaginationQueryDto) {
    // 1. 모든 재판 조회
    let allTrials: Trials[];
    const totalItems = await this.trialsRepository.count();
    try {
      const { page, limit } = paginationQueryDto;
      const skip = (page - 1) * limit;
      allTrials = await this.trialsRepository.find({
        skip,
        take: limit,
        order: {
          createdAt: 'DESC',
        },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        '게시물을 불러오는 도중 오류가 발생했습니다.',
      );
    }

    // 3. 있으면 리턴
    return {
      allTrials,
      totalItems,
    };
  }

  // 특정 재판 조회 매서드(회원/비회원 구분 X)
  async findOneByTrialsId(id: number) {
    // 1. id에 대한 재판 조회
    const OneTrials = await this.trialsRepository.findOneBy({ id });
    const vote = await this.votesRepository.findOneBy({ trialId: id });

    // 2. 없으면 404
    if (!OneTrials) {
      throw new NotFoundException('검색한 재판이 없습니다.');
    }

    // 있으면 리턴
    return { OneTrials, vote };
  }

  // 내 재판 업데이트
  async updateTrials(
    userId: number,
    trialsId: number,
    updateTrialDto: UpdateTrialDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 1. 재판 있는지 확인 findOneByTrialsId 안에서 유효성 검사 까지 진행
      const { OneTrials, vote } = await this.findOneByTrialsId(trialsId);

      // 2. 내 재판이 맞는지 유효성 검사
      if (OneTrials.userId !== userId) {
        throw new NotAcceptableException(
          '수정 권한이 없습니다. 로그인한 유저의 재판이 아닙니다.',
        );
      }

      // 3. 객체의 속성 업데이트
      Object.assign(OneTrials, updateTrialDto);

      // 4. 수정한거 저장
      await queryRunner.manager.save(Trials, OneTrials);

      //     // 5. 트랜잭션 종료
      //     await queryRunner.commitTransaction();

      return OneTrials;
    } catch (error) {
      await queryRunner.rollbackTransaction();
    }
  }

  //     console.log('재판 수정 에러:', error);

  //     throw new InternalServerErrorException(
  //       '재판 수정 중 오류가 발생했습니다.',
  //     );
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  // 내 재판 삭제
  async deleteTrials(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 1. 삭제하려는 재판이 존재하는지 검사
      const deleteResult = await queryRunner.manager.softDelete(Trials, {
        id: id,
      });

      // 2. 404 던지기
      if (deleteResult.affected === 0) {
        throw new NotFoundException(`존재하지 않거나 이미 삭제된 재판입니다.`);
      }

      // 3. 트랜잭션 종료
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.log('재판 삭제 에러:', error);

      throw new InternalServerErrorException(
        '재판 삭제 중 오류가 발생했습니다.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  // 내 재판인지 찾기 매서드
  async isMyTrials(userId: number, trialsId: number) {
    return !!(await this.trialsRepository.findOne({
      where: {
        id: trialsId,
        user: {
          id: userId,
        },
      },
    }));
  }

  // 모든 판례 조회 매서드
  async getAllDetails(cursor: number, limit: number) {
    const queryBuilder = this.panryeRepository
      .createQueryBuilder('panrye')
      .orderBy('panrye.판례정보일련번호', 'ASC')
      .limit(limit);

    if (cursor) {
      queryBuilder.where('panrye.판례정보일련번호 > :cursor', { cursor });
    }

    return queryBuilder.getMany();
  }

  // 판례 조회 매서드
  async findKeyWordDetails(name: string) {
    return this.panryeRepository.find({
      where: {
        판결유형: Like(`%${name}%`),
      },
    });
  }

  // 판결 유형으로 조회 매서드
  async findBypanguelcaseDetails(name: string) {
    return this.panryeRepository.find({
      where: {
        판결유형: name,
      },
    });
  }

  // 타임아웃되면 업데이트 매서드(불큐에서갖다씀 trialQueue.ts )
  async updateTimeDone(trialId: number) {
    return await this.trialsRepository.update(trialId, { is_time_over: true });
  }

  // 투표 vs 만들기 매서드
  async createSubject(trialId: number, voteDto: VoteTitleDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 객체 분해 할당 시킴 Dto
      const { title1, title2 } = voteDto;

      // 2. 객체에 담음(담는 이유 한번에 저장하면 빠름)
      const vote = {
        title1,
        title2,
        trialId,
      };

      // 3. 객체 만든거 생성
      const voteSubject = queryRunner.manager.create(Votes, vote);

      // 4. 만든 객체 저장
      await queryRunner.manager.save(Votes, voteSubject);

      // 5. 트랜 잭션 종료
      await queryRunner.commitTransaction();

      // 6. 잘 생성되면 vote 리턴
      return vote;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.log('vs 생성 오류:', error);

      throw new InternalServerErrorException('vs 생성 중 오류가 발생했습니다.');
    } finally {
      await queryRunner.release();
    }
  }

  // 투표 vs 수정 매서드
  async updateSubject(voteId: number, updateVoteDto: UpdateVoteDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 1. 수정할 투표 찾기
      const vote = await queryRunner.manager.findOne(Votes, {
        where: {
          id: voteId,
        },
      });

      // 2. 찾은 객체 업데이트(이렇게 하면 DB 한번만 들어가면됨)
      Object.assign(vote, updateVoteDto);

      // 3. 객체 저장
      await queryRunner.manager.save(Votes, vote);

      // 4. 트랜 잭션 종료

      await queryRunner.commitTransaction();

      return vote;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.log('vs 수정 오류:', error);

      throw new InternalServerErrorException('vs 수정 중 오류가 발생했습니다.');
    } finally {
      await queryRunner.release();
    }
  }

  // 투표 vs 삭제 매서드
  async deleteVote(voteId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 1. 재판 삭제(일반적으로 remove보다 delete가 더 빠르다.)
      const deleteResult = await queryRunner.manager.delete(Votes, {
        id: voteId,
      });

      // 2. 없으면 404
      if (deleteResult.affected === 0) {
        throw new NotFoundException(
          '찾는 재판이 없습니다. 또는 이미 삭제되었습니다.',
        );
      }
      // 3. 트랜 잭션 종료
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.log('vs 삭제 오류:', error);

      throw new InternalServerErrorException('vs 삭제 중 오류가 발생했습니다.');
    } finally {
      await queryRunner.release();
    }
  }

  // 활성화된 투표가 맞는지 검사 매서드(가드에서 사용)
  async checkIsActiveGuard(trialId: number) {
    const trial = await this.trialsRepository.findOne({
      where: {
        id: trialId,
      },
    });

    if (!trial || trial.is_time_over == true) {
      throw new Error('타임 아웃된 투표입니다.');
    }

    return trial;
  }

  // 판례 조회
  async getCaseDetails(caseId: string) {}
}
