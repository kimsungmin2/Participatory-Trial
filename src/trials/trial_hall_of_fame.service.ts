import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Trials } from './entities/trial.entity';
import { Between, DataSource, Repository } from 'typeorm';
import { Votes } from './entities/vote.entity';
import { TrialHallOfFames } from './entities/trial_hall_of_fame.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TrialLikeHallOfFames } from './entities/trail_hall_of_fame.like.entity';
import { TrialViewHallOfFames } from './entities/trial_hall_of_fame.view.entity';

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
    const lastWeekTrials = await this.trialsRepository.find({
      where: {
        createdAt: Between(start, end),
      },
    });

    // 투표 기반으로 명예의 전당 집계
    // 투표 수 데이터 가공
    const hallOfFameData = this.aggVotesForHallOfFame(lastWeekVotes);
    // 좋아요 데이터 가공
    const likeHallOfFameData = this.aggVotesLikeForHallOfFame(lastWeekTrials);
    // 조회수 데이터 가공
    const viewHallOfFameData = this.aggVotesViewForHallOfFame(lastWeekTrials);

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
      .createQueryBuilder('trial')
      .select(['trial.id', 'trial.title', 'trial.content'])
      .addSelect('trial.like', 'likes')
      .where('trial.createdAt BETWEEN :start AND :end', {
        start: start.toISOString(),
        end: end.toISOString(),
      })
      .having('likes >= :minlikes', { minlikes: 100 }) // 투표 수 100 이상인 것만 조회
      .orderBy('likes', 'DESC')
      .limit(1000) // 1000개 이상의 데이터가 없어도 남은 데이터 만큼 올라간다. 즉 데이터 집계 상한선이 1000개 라는 뜻
      .groupBy('trial.id')
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
      .select(['vote.id', 'vote.title1', 'vote.title2'])
      .addSelect('vote.voteCount1 + vote.voteCount2', 'totalVotes')
      .where('vote.createdAt BETWEEN :start AND :end', {
        start: start.toISOString(),
        end: end.toISOString(),
      })
      .having('totalVotes >= :minTotalVotes', { minTotalVotes: 100 }) // 투표 수 100 이상인 것만 조회
      .orderBy('totalVotes', 'DESC')
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
      // 한번에 저장
      const newHallOfFameEntries = hallOfFameData.map((data) => {
        const newHallOfFameEntry = new TrialHallOfFames();
        newHallOfFameEntry.id = data.id; // vote table의 id임다
        newHallOfFameEntry.userId = data.trial.userId; // vote에는 userId가 없으므로 일대일관계인 trial에 가서 userId 가져옴
        newHallOfFameEntry.title = `${data.title1} Vs ${data.title2}`;
        newHallOfFameEntry.content = data.trial.content; // vote에는 content가 없으므로 일대일관계인 trial에 가서 content 가져옴
        newHallOfFameEntry.totalVotes = data.voteCount1 + data.voteCount2;
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

  // DB에 명예의 전당 데이터를 업데이트(배열형태로 받아서 한번에 저장) ver 1.(좋아요)
  private async updateLikeHallOfFameDatabase(hallOfFameData: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 한번에 저장
      const newLikeHallOfFameEntries = hallOfFameData.map((data) => {
        const newLikeHallOfFameEntry = new TrialLikeHallOfFames();
        newLikeHallOfFameEntry.id = data.id; // vote table의 id임다
        newLikeHallOfFameEntry.userId = data.userId; // vote에는 userId가 없으므로 일대일관계인 trial에 가서 userId 가져옴
        newLikeHallOfFameEntry.title = data.title;
        newLikeHallOfFameEntry.content = data.content; // vote에는 content가 없으므로 일대일관계인 trial에 가서 content 가져옴
        newLikeHallOfFameEntry.totallike = data.like;
        newLikeHallOfFameEntry.createdAt = new Date();
        newLikeHallOfFameEntry.updatedAt = new Date();
        return newLikeHallOfFameEntry;
      });
      // DB에 새로운 명전 저장
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
      // 한번에 저장
      const newViewHallOfFameEntries = hallOfFameData.map((data) => {
        const newViewHallOfFameEntry = new TrialViewHallOfFames();
        newViewHallOfFameEntry.id = data.id; // vote table의 id임다
        newViewHallOfFameEntry.userId = data.userId; // vote에는 userId가 없으므로 일대일관계인 trial에 가서 userId 가져옴
        newViewHallOfFameEntry.title = data.title;
        newViewHallOfFameEntry.content = data.content; // vote에는 content가 없으므로 일대일관계인 trial에 가서 content 가져옴
        newViewHallOfFameEntry.totalview = data.like;
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
  async getRecentHallOfFame() {
    return await this.trialHallOfFamesRepository.find();
  }

  // 명예전당 좋아요 조회 매서드
  async getLikeRecentHallOfFame() {
    return await this.trialHallOfLikeFamesRepository.find();
  }

  // 명예전당 조회수 조회 매서드
  async getViewRecentHallOfFame() {
    return await this.trialHallOfViewFamesRepository.find();
  }
}
