import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Trials } from './entities/trial.entity';
import { Between, DataSource, Repository } from 'typeorm';
import { Votes } from './entities/vote.entity';
import { TrialHallOfFames } from './entities/trial_hall_of_fame.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TrialLikeHallOfFames } from './entities/trail_hall_of_fame.like.entity';
import { TrialViewHallOfFames } from './entities/trial_hall_of_fame.view.entity';
import { th } from '@faker-js/faker';
import { VotesService } from './vote/vote.service';
import { PaginationQueryDto } from 'src/humors/dto/get-humorBoard.dto';
import { throwIfEmpty } from 'rxjs';

@Injectable()
export class TrialHallOfFameService {
  constructor(
    @InjectRepository(Trials)
    private trialsRepository: Repository<Trials>,
    @InjectRepository(Votes)
    private votesRepository: Repository<Votes>,
    @InjectRepository(TrialHallOfFames)
    private trialHallOfFamesRepository: Repository<TrialHallOfFames>,
    @InjectRepository(TrialLikeHallOfFames)
    private trialHallOfLikeFamesRepository: Repository<TrialLikeHallOfFames>,
    @InjectRepository(TrialViewHallOfFames)
    private trialHallOfViewFamesRepository: Repository<TrialViewHallOfFames>,
    private readonly votesService: VotesService,
    private dataSource: DataSource,
  ) {}

  // 명예의 전당 매서드 일주일마다 업데이트
  @Cron('0 2 * * 1')
  async updateHallOfFame() {
    const { start, end } = this.getLastWeekRange();

    const lastWeekVotes = await this.votesRepository.find({
      where: {
        createdAt: Between(start, end),
      },
    });

    for (const vote of lastWeekVotes) {
      await this.votesService.updateVoteCounts(vote.id);
    }

    const lastWeekTrials = await this.trialsRepository.find({
      where: {
        createdAt: Between(start, end),
      },
    });

    // 투표 기반으로 명예의 전당 집계
    // 투표 수 데이터 가공
    const hallOfFameData = await this.aggVotesForHallOfFame(lastWeekVotes);
    // 좋아요 데이터 가공
    const likeHallOfFameData =
      await this.aggVotesLikeForHallOfFame(lastWeekTrials);
    // 조회수 데이터 가공
    const viewHallOfFameData =
      await this.aggVotesViewForHallOfFame(lastWeekTrials);

    // 업데이트
    // 투표 명전 업데이트
    await this.updateHallOfFameDatabase(hallOfFameData);

    // 좋아요 명전 업데이트
    await this.updateLikeHallOfFameDatabase(likeHallOfFameData);

    // 조회수 명전 업데이트
    await this.updateViewHallOfFameDatabase(viewHallOfFameData);
  }

  private getLastWeekRange() {
    // 1. 현재 날짜와 시간 laskWeekStart에 할당
    const lastWeekStart = new Date(); // 현재 날짜와 시간 laskWeekStart에 할당
    // 2. lastWeekStart의 날짜를 지난 주의 첫번째 날로 설정
    // 2-1. lastWeekStart.getDate() -7 - lastWeekStart.getDay() : 현재 날짜(일) -7 에서 현재 요일을 뺸다. 즉 현재 날짜에서 7일빼고 지금 요일을 빼면 저번주 일요일이 나옴(일요일이 0이고 토요일이 6)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7 - lastWeekStart.getDay());
    // 2-2. lastWeekStart의 시간을 00:00:00.000으로 설정한다.

    // 즉 2번 과정은 lastWeekStart를 저번주 일요일의 시작시간으로 만든다.
    lastWeekStart.setHours(0, 0, 0, 0);
    // 3. lastWeekEnd변수에 할당
    const lastWeekEnd = new Date(lastWeekStart);
    // 4. lastWeekEnd의 날짜를 6일뒤로 설정
    lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
    // 5. 토요일의 마지막 시간으로 설정함
    lastWeekEnd.setHours(23, 59, 59, 999);

    return { start: lastWeekStart, end: lastWeekEnd };
  }

  // 날짜 추상화 매서드(getThisMonthRange 메서드는 이번 달의 시작과 끝을 정확히 나타내는 날짜 범위를 제공)
  private getThisMonthRange() {
    const start = new Date();
    // start의 날짜를 이번 달의 첫 번째 날로 설정한다. 이는 Date 객체의 setDate 메서드를 사용하여 달의 날짜를 1로 설정함으로써 달의 시작을 나타낸다.
    start.setDate(1); // 이번달 첫쨰날
    start.setHours(0, 0, 0, 0); // 자정

    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999); // 하루의 마지막 시간

    return { start, end };
  }

  // 투표 데이터 집계 매서드(좋아요 수 기준)
  private async aggVotesLikeForHallOfFame(trials: Trials[]) {
    const { start, end } = this.getThisMonthRange();

    const candidates = await this.trialsRepository
      .createQueryBuilder('trial') // 'trial'을 alias로 사용
      .select([
        'trial.id',
        'trial.title',
        'trial.userId',
        'trial.content',
        'trial.like AS likes', // 'like' 속성을 'likes'로 셀렉트
      ])
      .where('trial.createdAt BETWEEN :start AND :end', {
        start: start.toISOString(),
        end: end.toISOString(),
      })
      .andWhere('trial.like >= :minlikes', { minlikes: 100 }) // 'like' 속성을 기준으로 필터링
      .orderBy('trial.like', 'DESC') // 'like' 속성을 기준으로 정렬
      .limit(1000)
      .getRawMany();

    return candidates;
  }

  // 투표 데이터 집계 매서드(조회수 수 기준)
  private async aggVotesViewForHallOfFame(trials: Trials[]) {
    const { start, end } = this.getThisMonthRange();

    const candidates = await this.trialsRepository
      .createQueryBuilder('trial')
      .select(['trial.id', 'trial.title', 'trial.content'])
      .addSelect('trial.view', 'views')
      .where('trial.createdAt BETWEEN :start AND :end', {
        start: start.toISOString(),
        end: end.toISOString(),
      })
      .having('views >= :minviews', { minviews: 100 }) // 투표 수 100 이상인 것만 조회
      .orderBy('views', 'DESC')
      .limit(1000) // 1000개 이상의 데이터가 없어도 남은 데이터 만큼 올라간다. 즉 데이터 집계 상한선이 1000개 라는 뜻
      .groupBy('trial.id')
      .getRawMany();

    return candidates;
  }

  // 투표 데이터 집계 매서드(투표 수 기준)
  private async aggVotesForHallOfFame(votes: Votes[]) {
    const { start, end } = this.getThisMonthRange();

    const candidates = await this.votesRepository
      .createQueryBuilder('vote')
      .leftJoinAndSelect('vote.trial', 'trial') // vote와 trial을 조인
      .select([
        'vote.id',
        'vote.title1',
        'vote.title2',
        'trial.userId',
        'trial.content',
      ])
      .addSelect('vote.voteCount1 + vote.voteCount2', 'total')
      .where('vote.createdAt BETWEEN :start AND :end', {
        start: start.toISOString(),
        end: end.toISOString(),
      })
      .having('total >= :minTotalVotes', { minTotalVotes: 100 }) // 투표 수 100 이상인 것만 조회
      .orderBy('total', 'DESC')
      .limit(1000) // 1000개 이상의 데이터가 없어도 남은 데이터 만큼 올라간다. 즉 데이터 집계 상한선이 1000개 라는 뜻
      .groupBy('vote.id')
      .getRawMany();

    return candidates;
  }

  // DB에 명예의 전당 데이터를 업데이트(배열형태로 받아서 한번에 저장) ver 1.(투표수)
  private async updateHallOfFameDatabase(hallOfFameData: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.delete(TrialHallOfFames, {});

      // 한번에 저장
      const newHallOfFameEntries = hallOfFameData.map((data) => {
        const newHallOfFameEntry = new TrialHallOfFames();
        newHallOfFameEntry.id = data.id; // vote table의 id임다
        newHallOfFameEntry.userId = data.userId; // vote에는 userId가 없으므로 일대일관계인 trial에 가서 userId 가져옴
        newHallOfFameEntry.title = `${data.title1} Vs ${data.title2}`;
        newHallOfFameEntry.content = data.content; // vote에는 content가 없으므로 일대일관계인 trial에 가서 content 가져옴
        newHallOfFameEntry.total = data.total;
        newHallOfFameEntry.createdAt = new Date();
        newHallOfFameEntry.updatedAt = new Date();
        return newHallOfFameEntry;
      });
      // DB에 새로운 명전 저장
      await queryRunner.manager.save(TrialHallOfFames, newHallOfFameEntries);

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  // // DB에 명예의 전당 데이터를 업데이트(배열형태로 받아서 한번에 저장) ver 1.(좋아요)
  private async updateLikeHallOfFameDatabase(hallOfFameData: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.delete(TrialLikeHallOfFames, {});

      const newLikeHallOfFameEntries = hallOfFameData.map((data) => {
        const newLikeHallOfFameEntry = new TrialLikeHallOfFames();
        // Trials 엔티티의 데이터를 기반으로 새 TrialLikeHallOfFames 인스턴스 생성
        newLikeHallOfFameEntry.id = data.id; // Trials 테이블의 id
        newLikeHallOfFameEntry.userId = data.userId; // Trials에서 userId 가져옴
        newLikeHallOfFameEntry.title = data.title; // Trials에서 title 가져옴
        newLikeHallOfFameEntry.content = data.content; // Trials에서 content 가져옴
        newLikeHallOfFameEntry.total = data.likes; // Trials에서 like 수 가져옴
        newLikeHallOfFameEntry.createdAt = new Date();
        newLikeHallOfFameEntry.updatedAt = new Date();
        return newLikeHallOfFameEntry;
      });

      await queryRunner.manager.save(
        TrialLikeHallOfFames,
        newLikeHallOfFameEntries,
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  // DB에 명예의 전당 데이터를 업데이트(배열형태로 받아서 한번에 저장) ver 1.(조회수)
  private async updateViewHallOfFameDatabase(hallOfFameData: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.delete(TrialViewHallOfFames, {});

      // 한번에 저장
      const newViewHallOfFameEntries = hallOfFameData.map((data) => {
        const newViewHallOfFameEntry = new TrialViewHallOfFames();
        newViewHallOfFameEntry.id = data.id; // vote table의 id임다
        newViewHallOfFameEntry.userId = data.userId; // vote에는 userId가 없으므로 일대일관계인 trial에 가서 userId 가져옴
        newViewHallOfFameEntry.title = data.title;
        newViewHallOfFameEntry.content = data.content; // vote에는 content가 없으므로 일대일관계인 trial에 가서 content 가져옴
        newViewHallOfFameEntry.total = data.views;
        newViewHallOfFameEntry.createdAt = new Date();
        newViewHallOfFameEntry.updatedAt = new Date();
        return newViewHallOfFameEntry;
      });
      // DB에 새로운 명전 저장
      await queryRunner.manager.save(
        TrialViewHallOfFames,
        newViewHallOfFameEntries,
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  // 명예전당 투표수 조회 매서드
  async getRecentHallOfFame(paginationQueryDto: PaginationQueryDto) {
    let trialHallOfFames: TrialHallOfFames[];

    const totalItems = await this.trialHallOfFamesRepository.count();
    try {
      const { page, limit } = paginationQueryDto;
      const skip = (page - 1) * limit;
      trialHallOfFames = await this.trialHallOfFamesRepository.find({
        skip,
        take: limit,
        order: {
          total: 'DESC',
        },
      });
    } catch (err) {
      console.log(err.message);
      throw new InternalServerErrorException(
        '명예의 전당을 불러오는 도중 오류가 발생했습니다.',
      );
    }
    return {
      trialHallOfFames,
      totalItems,
    };
  }

  // 명예전당 좋아요 조회 매서드
  async getLikeRecentHallOfFame(paginationQueryDto: PaginationQueryDto) {
    let trialLikeHallOfFames: TrialLikeHallOfFames[];

    const totalItems = await this.trialHallOfLikeFamesRepository.count();
    try {
      const { page, limit } = paginationQueryDto;
      const skip = (page - 1) * limit;
      trialLikeHallOfFames = await this.trialHallOfLikeFamesRepository.find({
        skip,
        take: limit,
        order: {
          total: 'DESC',
        },
      });
    } catch (err) {
      console.log(err.message);
      throw new InternalServerErrorException(
        '명예의 전당을 불러오는 도중 오류가 발생했습니다.',
      );
    }
    return {
      trialLikeHallOfFames,
      totalItems,
    };
  }

  // 명예전당 조회수 조회 매서드
  async getViewRecentHallOfFame(paginationQueryDto: PaginationQueryDto) {
    let trialViewHallOfFames: TrialViewHallOfFames[];

    const totalItems = await this.trialHallOfViewFamesRepository.count();
    try {
      const { page, limit } = paginationQueryDto;
      const skip = (page - 1) * limit;
      trialViewHallOfFames = await this.trialHallOfViewFamesRepository.find({
        skip,
        take: limit,
        order: {
          total: 'DESC',
        },
      });
    } catch (err) {
      console.log(err.message);
      throw new InternalServerErrorException(
        '명예의 전당을 불러오는 도중 오류가 발생했습니다.',
      );
    }
    return {
      trialViewHallOfFames,
      totalItems,
    };
  }

  // 특정 명전 투표 조회
  async findOneBytrialHallofFameVote(id: number) {
    const OneHallOfTrialVote = await this.trialHallOfFamesRepository.findOneBy({
      id,
    });

    if (!OneHallOfTrialVote) {
      throw new NotFoundException('검색한 명예의 전당이 없습니다.');
    }

    return { OneHallOfTrialVote };
  }

  // 특정 명전 좋아요 조회
  async findOneBytrialHallofFameLike(id: number) {
    const OneHallOfTrialLikes =
      await this.trialHallOfLikeFamesRepository.findOneBy({ id });

    if (!OneHallOfTrialLikes) {
      throw new NotFoundException('검색한 명예의 전당이 없습니다.');
    }

    return { OneHallOfTrialLikes };
  }

  // 특정 명전 조회수 조회
  async findOneBytrialHallofFameViews(id: number) {
    const OneHallOfTrialLikes =
      await this.trialHallOfViewFamesRepository.findOneBy({ id });
    console.log(OneHallOfTrialLikes);

    if (!OneHallOfTrialLikes) {
      throw new NotFoundException(`검색한 명예의 전당이 없습니다.${id}`);
    }

    return { OneHallOfTrialLikes };
  }
}
