import { Injectable } from "@nestjs/common";
import { OnlineBoards } from "./entities/online_board.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, DataSource, Repository } from "typeorm";
import { OnlineBoardLikeHallOfFames } from "./entities/online_boardLike_of_fame.entity";
import { OnlineBoardViewHallOfFames } from "./entities/online_boardVIew_of_fame.entity";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class OnlineBoardHallOfFameService {
    constructor(
        @InjectRepository(OnlineBoards)
        private onlineBoardsRepository: Repository<OnlineBoards>,
        @InjectRepository(OnlineBoardLikeHallOfFames)
        private onlineBoardLikeHallOfFames: Repository<OnlineBoardLikeHallOfFames>,
        @InjectRepository(OnlineBoardViewHallOfFames)
        private onlineBoardViewHallOfFames: Repository<OnlineBoardViewHallOfFames>,
        private dataSource: DataSource,
    ){}


    // 명예의 전당 일요일 2시 20분에 업데이트
    @Cron('0 2 * * 1')
    async updateHumorHallOfFame() {
        const { start, end } = this.getLastWeekRange();
        const lastWeekHumors = await this.onlineBoardsRepository.find({
            where: {
                createdAt: Between(start, end)
            }
        })
        // 좋아요 데이터 가공
        const likeHallOfFameData = this.aggVotesLikeForHallOfFame(lastWeekHumors)
        // 조회수 데이터 가공
        const viewHallOfFameData = this.aggVotesViewForHallOfFame(lastWeekHumors)

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
  lastWeekStart.setDate(lastWeekStart.getDate() -7 - lastWeekStart.getDay()); 
  // 2-2. lastWeekStart의 시간을 00:00:00.000으로 설정한다.

  // 즉 2번 과정은 lastWeekStart를 저번주 일요일의 시작시간으로 만든다.
  lastWeekStart.setHours(0, 0, 0, 0);
  // 3. lastWeekEnd변수에 할당
  const lastWeekEnd = new Date(lastWeekStart);
  // 4. lastWeekEnd의 날짜를 6일뒤로 설정
  lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
  // 5. 토요일의 마지막 시간으로 설정함
  lastWeekEnd.setHours(23, 59, 59, 999);

  return { start: lastWeekStart, end: lastWeekEnd }
}

// 날짜 추상화 매서드(getThisMonthRange 메서드는 이번 달의 시작과 끝을 정확히 나타내는 날짜 범위를 제공)
private getThisMonthRange(){
    const start = new Date();
    // start의 날짜를 이번 달의 첫 번째 날로 설정한다. 이는 Date 객체의 setDate 메서드를 사용하여 달의 날짜를 1로 설정함으로써 달의 시작을 나타낸다.
    start.setDate(1); // 이번달 첫쨰날
    start.setHours(0, 0, 0, 0) // 자정
  
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999) // 하루의 마지막 시간
  
    return { start, end }
  }


  // 데이터 집계 매서드(좋아요 수 기준)
private async aggVotesLikeForHallOfFame(onlineBoards: OnlineBoards[]){
    const { start, end } = this.getThisMonthRange();
  
    const candidates = await this.onlineBoardsRepository
    .createQueryBuilder("onlineBoards")
    .select(['onlineBoards.id', 'onlineBoards.title', 'onlineBoards.content'])
    .addSelect("onlineBoards.like", "likes")
    .where('onlineBoards.createdAt BETWEEN :start AND :end', { start: start.toISOString(), end: end.toISOString() })
    .having("likes >= :minlikes", { minlikes: 100 }) // 투표 수 100 이상인 것만 조회
    .orderBy('likes', "DESC")
    .limit(1000)// 1000개 이상의 데이터가 없어도 남은 데이터 만큼 올라간다. 즉 데이터 집계 상한선이 1000개 라는 뜻
    .groupBy("onlineBoards.id")
    .getRawMany();
  
    return candidates
  }

// 데이터 집계 매서드(조회수 수 기준)
private async aggVotesViewForHallOfFame(onlineBoards: OnlineBoards[]){
    const { start, end } = this.getThisMonthRange();
  
    const candidates = await this.onlineBoardsRepository
    .createQueryBuilder("onlineBoards")
    .select(['onlineBoards.id', 'onlineBoards.title', 'onlineBoards.content'])
    .addSelect("onlineBoards.view", "views")
    .where('onlineBoards.createdAt BETWEEN :start AND :end', { start: start.toISOString(), end: end.toISOString() })
    .having("views >= :minviews", { minviews: 100 }) // 투표 수 100 이상인 것만 조회
    .orderBy('views', "DESC")
    .limit(1000)// 1000개 이상의 데이터가 없어도 남은 데이터 만큼 올라간다. 즉 데이터 집계 상한선이 1000개 라는 뜻
    .groupBy("onlineBoards.id")
    .getRawMany();
  
    return candidates
  }


  // DB에 명예의 전당 데이터를 업데이트(배열형태로 받아서 한번에 저장) ver 1.(좋아요)
private async updateLikeHallOfFameDatabase(hallOfFameData: any){
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try{
    // 한번에 저장
      const newLikeHallOfFameEntries = hallOfFameData.map(data => {
      const newLikeHallOfFameEntry = new OnlineBoardLikeHallOfFames();
      newLikeHallOfFameEntry.id = data.id // vote table의 id임다
      newLikeHallOfFameEntry.userId = data.userId // vote에는 userId가 없으므로 일대일관계인 trial에 가서 userId 가져옴
      newLikeHallOfFameEntry.title = data.title;
      newLikeHallOfFameEntry.content = data.content; // vote에는 content가 없으므로 일대일관계인 trial에 가서 content 가져옴
      newLikeHallOfFameEntry.totallike = data.like;
      newLikeHallOfFameEntry.createdAt = new Date();
      newLikeHallOfFameEntry.updatedAt = new Date();
      return newLikeHallOfFameEntry;
    });
      // DB에 새로운 명전 저장
      await queryRunner.manager.save(OnlineBoardLikeHallOfFames, newLikeHallOfFameEntries)
    
      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
    }

    // DB에 명예의 전당 데이터를 업데이트(배열형태로 받아서 한번에 저장) ver 1.(조회수)
private async updateViewHallOfFameDatabase(hallOfFameData: any){
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try{
    // 한번에 저장
      const newViewHallOfFameEntries = hallOfFameData.map(data => {
      const newViewHallOfFameEntry = new OnlineBoardViewHallOfFames();
      newViewHallOfFameEntry.id = data.id // vote table의 id임다
      newViewHallOfFameEntry.userId = data.userId // vote에는 userId가 없으므로 일대일관계인 trial에 가서 userId 가져옴
      newViewHallOfFameEntry.title = data.title;
      newViewHallOfFameEntry.content = data.content; // vote에는 content가 없으므로 일대일관계인 trial에 가서 content 가져옴
      newViewHallOfFameEntry.totalview = data.like;
      newViewHallOfFameEntry.createdAt = new Date();
      newViewHallOfFameEntry.updatedAt = new Date();
      return newViewHallOfFameEntry;
    });
      // DB에 새로운 명전 저장
      await queryRunner.manager.save(OnlineBoardViewHallOfFames, newViewHallOfFameEntries)
    
      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
    }
  
  
  // 명예전당 좋아요 조회 매서드
  async getLikeRecentHallOfFame(){
      return await this.onlineBoardLikeHallOfFames.find();
    }
  
  // 명예전당 조회수 조회 매서드
  async getViewRecentHallOfFame(){
      return await this.onlineBoardViewHallOfFames.find();
    }
}