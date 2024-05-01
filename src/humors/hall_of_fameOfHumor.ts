import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HumorBoards } from './entities/humor-board.entity';
import { Between, DataSource, Repository } from 'typeorm';
import { HumorVotes } from './entities/HumorVote.entity';
import { HumorsHallOfFame } from './entities/humor_hall_of_fame.entity';
import { HumorsLikeHallOfFames } from './entities/humor_hall_of_fame.like.entity';
import { HumorsViewHallOfFames } from './entities/humor_hall_of_fame.view.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaginationQueryDto } from './dto/get-humorBoard.dto';
import { th } from '@faker-js/faker';
import { HumorVotesService } from './humors_votes/humors_votes.service';

@Injectable()
export class HumorHallOfFameService {
  constructor(
    @InjectRepository(HumorBoards)
    private humorsRepository: Repository<HumorBoards>,
    @InjectRepository(HumorVotes)
    private humorVotesRepository: Repository<HumorVotes>,
    @InjectRepository(HumorsHallOfFame)
    private humorsHallOfFameRepository: Repository<HumorsHallOfFame>,
    @InjectRepository(HumorsLikeHallOfFames)
    private humorsLikeHallOfFamesRepository: Repository<HumorsLikeHallOfFames>,
    @InjectRepository(HumorsViewHallOfFames)
    private humorsViewHallOfFamesRepository: Repository<HumorsViewHallOfFames>,
    private readonly humorVotesService: HumorVotesService,
    private dataSource: DataSource,
  ) {}

  // 명예의 전당 일요일 2시 20분에 업데이트
  @Cron('0 2 * * 1')
  async updateHumorHallOfFame() {
    const { start, end } = this.getLastWeekRange();

    const lastWeekVotes = await this.humorVotesRepository.find({
      where: {
        createdAt: Between(start, end),
      },
    });

    for (const vote of lastWeekVotes) {
      await this.humorVotesService.updateVoteCounts(vote.id);
    }

    const lastWeekHumors = await this.humorsRepository.find({
      where: {
        createdAt: Between(start, end),
      },
    });

    // 투표 기반으로 명예의 전당 집계
    // 투표 수 데이터 가공
    const hallOfFameData = this.aggVotesForHallOfFame(lastWeekVotes);
    // 좋아요 데이터 가공
    const likeHallOfFameData = this.aggVotesLikeForHallOfFame(lastWeekHumors);
    // 조회수 데이터 가공
    const viewHallOfFameData = this.aggVotesViewForHallOfFame(lastWeekHumors);

    // 업데이트
    // 투표 명전 업데이트
    await this.updateHallOfFameDatabase(hallOfFameData);

    // 좋아요 명전 업데이트
    await this.updateLikeHallOfFameDatabase(likeHallOfFameData);

    // 조회수 명전 업데이트
    await this.updateViewHallOfFameDatabase(viewHallOfFameData);
  }

   getLastWeekRange() {
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
   getThisMonthRange() {
    const start = new Date();
    // start의 날짜를 이번 달의 첫 번째 날로 설정한다. 이는 Date 객체의 setDate 메서드를 사용하여 달의 날짜를 1로 설정함으로써 달의 시작을 나타낸다.
    start.setDate(1); // 이번달 첫쨰날
    start.setHours(0, 0, 0, 0); // 자정

    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999); // 하루의 마지막 시간

    return { start, end };
  }

  // 투표 데이터 집계 매서드(좋아요 수 기준)
   async aggVotesLikeForHallOfFame(humorBoards: HumorBoards[]) {
    const { start, end } = this.getThisMonthRange();

    const candidates = await this.humorsRepository
      .createQueryBuilder('humor')
      .select([
        'humor.id',
        'humor.title',
        'humor.userId',
        'humor.content',
        'humor.like AS likes', // 'like' 속성을 'likes'로 셀렉트
      ])
      .where('humor.createdAt BETWEEN :start AND :end', {
        start: start.toISOString(),
        end: end.toISOString(),
      })
      .andWhere('humor.like >= :minlikes', { minlikes: 100 }) // 'like' 속성을 기준으로 필터링
      .orderBy('humor.like', 'DESC') // 'like' 속성을 기준으로 정렬
      .limit(1000)
      .getRawMany();

    return candidates;
  }

  // 투표 데이터 집계 매서드(조회수 수 기준)
   async aggVotesViewForHallOfFame(humorBoards: HumorBoards[]) {
    const { start, end } = this.getThisMonthRange();

    const candidates = await this.humorsRepository
      .createQueryBuilder('humor')
      .select(['humor.id', 'humor.title', 'humor.content'])
      .addSelect('humor.view', 'views')
      .where('humor.createdAt BETWEEN :start AND :end', {
        start: start.toISOString(),
        end: end.toISOString(),
      })
      .having('views >= :minviews', { minviews: 100 }) // 투표 수 100 이상인 것만 조회
      .orderBy('views', 'DESC')
      .limit(1000) // 1000개 이상의 데이터가 없어도 남은 데이터 만큼 올라간다. 즉 데이터 집계 상한선이 1000개 라는 뜻
      .groupBy('humor.id')
      .getRawMany();

    return candidates;
  }

  // 투표 데이터 집계 매서드(투표 수 기준)
   async aggVotesForHallOfFame(humorVotes: HumorVotes[]) {
    const { start, end } = this.getThisMonthRange();

    const candidates = await this.humorVotesRepository
      .createQueryBuilder('humorVote')
      .leftJoinAndSelect('humorVote.humorBoards', 'humorBoards') // vote와 trial을 조인
      .select([
        'humorVote.id',
        'humorVote.title1',
        'humorVote.title2',
        'humorBoards.userId',
        'humorBoards.content',
      ])
      .addSelect('humorVote.voteCount1 + humorVote.voteCount2', 'totalVotes')
      .where('humorVote.createdAt BETWEEN :start AND :end', {
        start: start.toISOString(),
        end: end.toISOString(),
      })
      .having('total >= :minTotalVotes', { minTotalVotes: 100 }) // 투표 수 100 이상인 것만 조회
      .orderBy('total', 'DESC')
      .limit(1000) // 1000개 이상의 데이터가 없어도 남은 데이터 만큼 올라간다. 즉 데이터 집계 상한선이 1000개 라는 뜻
      .groupBy('humorVote.id')
      .getRawMany();

    return candidates;
  }

  // DB에 명예의 전당 데이터를 업데이트(배열형태로 받아서 한번에 저장) ver 1.(투표수)
   async updateHallOfFameDatabase(hallOfFameData: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 한번에 저장
      await queryRunner.manager.delete(HumorsHallOfFame, {});

      const newHallOfFameEntries = hallOfFameData.map((data) => {
        const newHallOfFameEntry = new HumorsHallOfFame();
        newHallOfFameEntry.id = data.id; // vote table의 id임다
        newHallOfFameEntry.userId = data.userId; // vote에는 userId가 없으므로 일대일관계인 trial에 가서 userId 가져옴
        newHallOfFameEntry.title = `${data.title1} Vs ${data.title2}`;
        newHallOfFameEntry.content = data.content; // vote에는 content가 없으므로 일대일관계인 trial에 가서 content 가져옴
        newHallOfFameEntry.totalVotes = data.total;
        newHallOfFameEntry.createdAt = new Date();
        newHallOfFameEntry.updatedAt = new Date();
        return newHallOfFameEntry;
      });
      // DB에 새로운 명전 저장
      await queryRunner.manager.save(HumorsHallOfFame, newHallOfFameEntries);

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  // DB에 명예의 전당 데이터를 업데이트(배열형태로 받아서 한번에 저장) ver 1.(좋아요)
   async updateLikeHallOfFameDatabase(hallOfFameData: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.delete(HumorsLikeHallOfFames, {});

      // 한번에 저장
      const newLikeHallOfFameEntries = hallOfFameData.map((data) => {
        const newLikeHallOfFameEntry = new HumorsLikeHallOfFames();
        newLikeHallOfFameEntry.id = data.id; // vote table의 id임다
        newLikeHallOfFameEntry.userId = data.userId; // vote에는 userId가 없으므로 일대일관계인 trial에 가서 userId 가져옴
        newLikeHallOfFameEntry.title = data.title;
        newLikeHallOfFameEntry.content = data.content; // vote에는 content가 없으므로 일대일관계인 trial에 가서 content 가져옴
        newLikeHallOfFameEntry.totallike = data.likes;
        newLikeHallOfFameEntry.createdAt = new Date();
        newLikeHallOfFameEntry.updatedAt = new Date();
        return newLikeHallOfFameEntry;
      });
      // DB에 새로운 명전 저장
      await queryRunner.manager.save(
        HumorsLikeHallOfFames,
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
   async updateViewHallOfFameDatabase(hallOfFameData: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.delete(HumorsViewHallOfFames, {});

      // 한번에 저장
      const newViewHallOfFameEntries = hallOfFameData.map((data) => {
        const newViewHallOfFameEntry = new HumorsViewHallOfFames();
        newViewHallOfFameEntry.id = data.id; // vote table의 id임다
        newViewHallOfFameEntry.userId = data.userId; // vote에는 userId가 없으므로 일대일관계인 trial에 가서 userId 가져옴
        newViewHallOfFameEntry.title = data.title;
        newViewHallOfFameEntry.content = data.content; // vote에는 content가 없으므로 일대일관계인 trial에 가서 content 가져옴
        newViewHallOfFameEntry.totalview = data.views;
        newViewHallOfFameEntry.createdAt = new Date();
        newViewHallOfFameEntry.updatedAt = new Date();
        return newViewHallOfFameEntry;
      });
      // DB에 새로운 명전 저장
      await queryRunner.manager.save(
        HumorsViewHallOfFames,
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
    let humorsHallOfFame: HumorsHallOfFame[];

    const totalItems = await this.humorsHallOfFameRepository.count();
    try {
      const { page, limit } = paginationQueryDto;
      const skip = (page - 1) * limit;
      humorsHallOfFame = await this.humorsHallOfFameRepository.find({
        skip,
        take: limit,
        order: {
          totalVotes: 'DESC',
        },
      });
    } catch (err) {
      console.log(err.message);
      throw new InternalServerErrorException(
        '명예의 전당을 불러오는 도중오류가 발생했습니다',
      );
    }
    return {
      humorsHallOfFame,
      totalItems,
    };
  }

  // 명예전당 좋아요 조회 매서드
  async getLikeRecentHallOfFame(paginationQueryDto: PaginationQueryDto) {
    let humorsLikeHallOfFames: HumorsLikeHallOfFames[];

    const totalItems = await this.humorsLikeHallOfFamesRepository.count();
    try {
      const { page, limit } = paginationQueryDto;
      const skip = (page - 1) * limit;
      humorsLikeHallOfFames = await this.humorsLikeHallOfFamesRepository.find({
        skip,
        take: limit,
        order: {
          totallike: 'DESC',
        },
      });
    } catch (err) {
      console.log(err.message);
      throw new InternalServerErrorException(
        '명예의 전당을 불러오는 도중오류가발생했습니다.',
      );
    }
    return {
      humorsLikeHallOfFames,
      totalItems,
    };
  }

  // 명예전당 조회수 조회 매서드
  async getViewRecentHallOfFame(paginationQueryDto: PaginationQueryDto) {
    let humorsViewHallOfFames: HumorsViewHallOfFames[];

    const totalItems = await this.humorsViewHallOfFamesRepository.count();
    try {
      const { page, limit } = paginationQueryDto;
      const skip = (page - 1) * limit;
      humorsViewHallOfFames = await this.humorsViewHallOfFamesRepository.find({
        skip,
        take: limit,
        order: {
          totalview: 'DESC',
        },
      });
    } catch (err) {
      console.log(err.message);
      throw new InternalServerErrorException(
        '명예의 전당을 불러오는도중 오류가 발생했습니다.',
      );
    }
    return {
      humorsViewHallOfFames,
      totalItems,
    };
  }

  // 특정 명전 투표 조회
  async findOneByhumorHallofFameVote(id: number) {
    const OneHallOfHumorVote = await this.humorsHallOfFameRepository.findOneBy({
      id,
    });

    if (!OneHallOfHumorVote) {
      throw new NotFoundException('검색한 명예의 전당이 없습니다.');
    }

    return { OneHallOfHumorVote };
  }

  // 특정 명전 좋아요 조회
  async findOneByhumorHallofFameLike(id: number) {
    const OneHallOfHumorLikes =
      await this.humorsLikeHallOfFamesRepository.findOneBy({ id });

    if (!OneHallOfHumorLikes) {
      throw new NotFoundException('검색한 명예의 전당이 없습니다.');
    }

    return { OneHallOfHumorLikes };
  }

  // 특정 명전 조회수 조회
  async findOneByhumorHallofFameViews(id: number) {
    const OneHallOfTrialViews =
      await this.humorsViewHallOfFamesRepository.findOneBy({ id });

    if (!OneHallOfTrialViews) {
      throw new NotFoundException('검색한 명예의 전당이 없습니다.');
    }

    return { OneHallOfTrialViews };
  }
}
