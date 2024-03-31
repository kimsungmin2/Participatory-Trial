import { Injectable, InternalServerErrorException, NotAcceptableException, NotFoundException } from '@nestjs/common';
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
import { VoteDto } from './vote/dto/voteDto';
import { UpdateVoteDto } from './vote/dto/updateDto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TrialHallOfFames } from './entities/trial_hall_of_fame.entity';
import { TrialLikeHallOfFames } from './entities/trail_hall_of_fame.like.entity';
import { TrialViewHallOfFames } from './entities/trial_hall_of_fame.view.entity';

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
    @InjectQueue('trial-queue') private trialQueue: Queue
  ){}
 //------------------------------------------------------------- 명예의 전당 ----------------------------------------------------------------------------///


  // 명예의 전당 매서드 일주일마다 업데이트
  @Cron(CronExpression.EVERY_WEEK)
  async updateHallOfFame() {
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 7 - lastWeekStart.getDay())
    lastWeekStart.setHours(0, 0, 0, 0);

    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() + 6)
    lastWeekEnd.setHours(23, 59, 59, 999);

    // 지난주에 진행된 투표 데이터를 조회
    const lastWeekVotes = await this.votesRepository.find({
      where: {
        createdAt: Between(lastWeekStart, lastWeekEnd),
      },
    });

    // 지난주에 진행된 재판 데이터를 조회
    const lastWeekTrials= await this.trialsRepository.find({
      where: {
        createdAt: Between(lastWeekStart, lastWeekEnd)
      },
    });

    // 투표 기반으로 명예의 전당 집계
    // 투표 수 데이터 가공
    const hallOfFameData = this.aggVotesForHallOfFame(lastWeekVotes)
    // 좋아요 데이터 가공
    const likeHallOfFameData = this.aggVotesLikeForHallOfFame(lastWeekTrials)
    // 조회수 데이터 가공
    const viewHallOfFameData = this.aggVotesViewForHallOfFame(lastWeekTrials)

    // 업데이트
    // 투표 명전 업데이트
    await this.updateHallOfFameDatabase(hallOfFameData);

    // 좋아요 명전 업데이트
    await this.updateLikeHallOfFameDatabase(likeHallOfFameData);

    // 조회수 명전 업데이트
    await this.updateViewHallOfFameDatabase(viewHallOfFameData);
  }




  // 날짜 추상화 매서드
  private getThisMonthRange(){
    const start = new Date();
    start.setDate(1); // 이번달 첫쨰날
    start.setHours(0, 0, 0, 0) // 자정

    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999) // 하루의 마지막 시간

    return { start, end }
  }

  // 투표 데이터 집계 매서드(좋아요 수 기준)
  private async aggVotesLikeForHallOfFame(trials: Trials[]){
    const { start, end } = this.getThisMonthRange();

    const candidates = await this.trialsRepository
    .createQueryBuilder("trial")
    .select(['trial.id', 'trial.title', 'trial.content'])
    .addSelect("trial.like", "likes")
    .where('trial.createdAt BETWEEN :start AND :end', { start: start.toISOString(), end: end.toISOString() })
    .having("likes >= :minlikes", { minlikes: 100 }) // 투표 수 100 이상인 것만 조회
    .orderBy('likes', "DESC")
    .limit(1000)// 1000개 이상의 데이터가 없어도 남은 데이터 만큼 올라간다. 즉 데이터 집계 상한선이 1000개 라는 뜻
    .groupBy("trial.id")
    .getRawMany();

    return candidates
  }

  // 투표 데이터 집계 매서드(조회수 수 기준)
  private async aggVotesViewForHallOfFame(trials: Trials[]){
    const { start, end } = this.getThisMonthRange();

    const candidates = await this.trialsRepository
    .createQueryBuilder("trial")
    .select(['trial.id', 'trial.title', 'trial.content'])
    .addSelect("trial.view", "views")
    .where('trial.createdAt BETWEEN :start AND :end', { start: start.toISOString(), end: end.toISOString() })
    .having("views >= :minviews", { minviews: 100 }) // 투표 수 100 이상인 것만 조회
    .orderBy('views', "DESC")
    .limit(1000)// 1000개 이상의 데이터가 없어도 남은 데이터 만큼 올라간다. 즉 데이터 집계 상한선이 1000개 라는 뜻
    .groupBy("trial.id")
    .getRawMany();

    return candidates
  }

  // 투표 데이터 집계 매서드(투표 수 기준)
  private async aggVotesForHallOfFame(votes: Votes[]){
    const { start, end } = this.getThisMonthRange();

    const candidates = await this.votesRepository
    .createQueryBuilder("vote")
    .select(['vote.id', 'vote.title1', 'vote.title2'])
    .addSelect("vote.voteCount1 + vote.voteCount2", "totalVotes")
    .where('vote.createdAt BETWEEN :start AND :end', { start: start.toISOString(), end: end.toISOString() })
    .having("totalVotes >= :minTotalVotes", { minTotalVotes: 100 }) // 투표 수 100 이상인 것만 조회
    .orderBy('totalVotes', "DESC")
    .limit(1000)// 1000개 이상의 데이터가 없어도 남은 데이터 만큼 올라간다. 즉 데이터 집계 상한선이 1000개 라는 뜻
    .groupBy("vote.id")
    .getRawMany();

    return candidates
  }

  // DB에 명예의 전당 데이터를 업데이트(배열형태로 받아서 한번에 저장) ver 1.(투표수)
  private async updateHallOfFameDatabase(hallOfFameData: any){
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try{
    // 한번에 저장
      const newHallOfFameEntries = hallOfFameData.map(data => {
      const newHallOfFameEntry = new TrialHallOfFames();
      newHallOfFameEntry.id = data.id // vote table의 id임다
      newHallOfFameEntry.userId = data.trial.userId // vote에는 userId가 없으므로 일대일관계인 trial에 가서 userId 가져옴
      newHallOfFameEntry.title = data.title1 + 'Vs' + data.title2
      newHallOfFameEntry.content = data.trial.content; // vote에는 content가 없으므로 일대일관계인 trial에 가서 content 가져옴
      newHallOfFameEntry.totalVotes = data.voteCount1 + data.voteCount2;
      newHallOfFameEntry.createdAt = new Date();
      newHallOfFameEntry.updatedAt = new Date();
      return newHallOfFameEntry;
    });
      // DB에 새로운 명전 저장
      await queryRunner.manager.save(TrialHallOfFames, newHallOfFameEntries)

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }


// DB에 명예의 전당 데이터를 업데이트(배열형태로 받아서 한번에 저장) ver 1.(좋아요)
private async updateLikeHallOfFameDatabase(hallOfFameData: any){
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try{
  // 한번에 저장
    const newLikeHallOfFameEntries = hallOfFameData.map(data => {
    const newLikeHallOfFameEntry = new TrialLikeHallOfFames();
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
    await queryRunner.manager.save(TrialLikeHallOfFames, newLikeHallOfFameEntries)

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
    const newViewHallOfFameEntry = new TrialViewHallOfFames();
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
    await queryRunner.manager.save(TrialViewHallOfFames, newViewHallOfFameEntries)

    await queryRunner.commitTransaction();
  } catch (err) {
    console.log(err);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
  }
}









  // 명예의 전당 조회 매서드
  async getRecentHallOfFame(){
    return await this.trialHallOfFamesRepository.find();
  }


 //------------------------------------------------------------- 명예의 전당 ----------------------------------------------------------------------------///
  // 재판 생성
  async createTrial(userId: number, createTrialDto: CreateTrialDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try{
      // 1. Dto에서 title, content 뽑아내기
      const { title, content, trialTime } = createTrialDto;

      // 2. 객체에 넣기
      const data = {
        title,
        content,
        userId,
        is_time_over: false,
      }

      // 3. 재판 생성
      const newTrial = queryRunner.manager.create(Trials, data)

      // 4. 재판 저장
      const savedTrial = await queryRunner.manager.save(Trials, newTrial)

      // 5. 불 큐로 지연시간 후 찍어줌
      const delay = trialTime - Date.now();

      // 6. 제한 시간끝나면 불큐로 비동기 처리
      await this.trialQueue.add('updateTimeDone', { trialId: savedTrial.id }, { delay });

      // 7. 트랜 잭션 종료
      await queryRunner.commitTransaction();
      
      return savedTrial;
  } catch(error){

    await queryRunner.rollbackTransaction();

    console.log("재판 생성 에러:", error)

    throw new InternalServerErrorException(
      "재판 생성 중 오류가 발생했습니다."
    )
  } finally {

    await queryRunner.release()

  }
}

// 유저Id로 모든 재판 찾기 매서드(유저 내 재판 조회)
async findByUserTrials(userId: number) {

  // 1. 해당 유저의 재판이 있는지 확인
  const trials = await this.trialsRepository.findOneBy({ userId });

  // 2. 없으면 404
  if(!trials) {
    throw new NotFoundException("해당 유저의 재판이 없습니다.")
  }

  // 3. 있으면 리턴
    return trials;
  }


  // 모든 재판 조회 매서드(유저/비회원 구분 X)
  async findAllTrials() {
    // 1. 모든 재판 조회
    const allTrials = await this.trialsRepository.find()

    // 2. 없으면 404
    if(!allTrials){
      throw new NotFoundException("조회할 재판이 없습니다.")
    }

    // 3. 있으면 리턴
    return allTrials
  }


  // 특정 재판 조회 매서드(회원/비회원 구분 X)
  async findOneByTrialsId(id: number) {
    // 1. id에 대한 재판 조회
    const OneTrials = await this.trialsRepository.findOneBy({ id })

    // 2. 없으면 404  
    if(!OneTrials){
      throw new NotFoundException("검색한 재판이 없습니다.")
    }

    // 있으면 리턴
    return OneTrials;
  }

  // 내 재판 업데이트
  async updateTrials(userId: number, trialsId: number, updateTrialDto: UpdateTrialDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try{
      // 1. 재판 있는지 확인 findOneByTrialsId 안에서 유효성 검사 까지 진행
      const existTrial = await this.findOneByTrialsId(trialsId)
      
      // 2. 내 재판이 맞는지 유효성 검사
      if(existTrial.userId !== userId) {
        throw new NotAcceptableException('수정 권한이 없습니다. 로그인한 유저의 재판이 아닙니다.')
      }

      // 3. 객체의 속성 업데이트
      Object.assign(existTrial, updateTrialDto)

      // 4. 수정한거 저장
      await queryRunner.manager.save(Trials, existTrial)
      
      // 5. 트랜잭션 종료
      await queryRunner.commitTransaction();

      return existTrial

    } catch(error){

      await queryRunner.rollbackTransaction();
  
      console.log("재판 수정 에러:", error)
  
      throw new InternalServerErrorException(
        "재판 수정 중 오류가 발생했습니다."
      )
    } finally {
  
      await queryRunner.release()
  
    }
  }

  // 내 재판 삭제
  async deleteTrials(id: number) {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction()
    try{
      // 1. 삭제하려는 재판이 존재하는지 검사
      const deleteResult = await queryRunner.manager.delete(Trials, { id: id });

      // 2. 404 던지기
      if (deleteResult.affected === 0) {
      throw new NotFoundException(`존재하지 않거나 이미 삭제된 재판입니다.`);
      }

      // 3. 트랜잭션 종료
      await queryRunner.commitTransaction();
    } catch(error){

      await queryRunner.rollbackTransaction();
  
      console.log("재판 삭제 에러:", error)
  
      throw new InternalServerErrorException(
        "재판 삭제 중 오류가 발생했습니다."
      )
    } finally {
  
      await queryRunner.release()
  
    }   
  }

  // 내 재판인지 찾기 매서드
  async isMyTrials(userId: number, trialsId: number) {
    return await this.trialsRepository.findOne({
      where : {
        id: trialsId,
        user: {
          id: userId,
        },
      }
    })
  }


  // 모든 판례 조회 매서드
  async getAllDetails(cursor: number, limit: number) {
    const queryBuilder = this.panryeRepository.createQueryBuilder('panrye')
      .orderBy('panrye.판례정보일련번호', 'ASC')
      .limit(limit);

      if(cursor){
        queryBuilder.where('panrye.판례정보일련번호 > :cursor', { cursor })
      }

      return queryBuilder.getMany();
  }

  // 판례 조회 매서드
  async findKeyWordDetails(name: string) {
    return this.panryeRepository.find({
      where: {
        판결유형: Like(`%${name}%`),
      }
    })
  }

  // 판결 유형으로 조회 매서드
  async findBypanguelcaseDetails(name: string) {
    return this.panryeRepository.find({
      where: {
        판결유형: name,
      }
    })
  }


  // 타임아웃되면 업데이트 매서드(불큐에서갖다씀 trialQueue.ts )
  async updateTimeDone(trialId: number) {
    await this.trialsRepository.update(trialId, { is_time_over: true })
  }


  // 투표 vs 만들기 매서드
  async createSubject(trialId: number, voteDto: VoteDto){
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try{
    // 1. 객체 분해 할당 시킴 Dto
    const { title1, title2 } = voteDto

    // 2. 객체에 담음(담는 이유 한번에 저장하면 빠름)
    const vote = {
      title1,
      title2,
      trialId
    }

    // 3. 객체 만든거 생성
    const voteSubject = queryRunner.manager.create(Votes, vote)


    // 4. 만든 객체 저장
    await queryRunner.manager.save(Votes, voteSubject)

    // 5. 트랜 잭션 종료
    await queryRunner.commitTransaction();

    // 6. 잘 생성되면 vote 리턴
    return vote
  } catch(error){

    await queryRunner.rollbackTransaction();

    console.log("vs 생성 오류:", error)

    throw new InternalServerErrorException(
      "vs 생성 중 오류가 발생했습니다."
    )
  } finally {

    await queryRunner.release()

  }
  }


  // 투표 vs 수정 매서드
  async updateSubject(voteId: number, updateVoteDto: UpdateVoteDto)
  {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try{
    // 1. 수정할 투표 찾기
    const vote = await queryRunner.manager.findOne(Votes,{
      where: {
        id: voteId,
      }
    })

    // 2. 찾은 객체 업데이트(이렇게 하면 DB 한번만 들어가면됨)
    Object.assign(vote, updateVoteDto)

    // 3. 객체 저장
    await queryRunner.manager.save(Votes, vote)

    // 4. 트랜 잭션 종료

    await queryRunner.commitTransaction();

    return vote
  } catch(error){

      await queryRunner.rollbackTransaction();
  
      console.log("vs 수정 오류:", error)
  
      throw new InternalServerErrorException(
        "vs 수정 중 오류가 발생했습니다."
      )
    } finally {
  
      await queryRunner.release()
  
    }
  }

  // 투표 vs 삭제 매서드
  async deleteVote(voteId: number)
  {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try{
    // 1. 재판 삭제(일반적으로 remove보다 delete가 더 빠르다.)
    const deleteResult = await queryRunner.manager.delete(Votes,{id:voteId});

    // 2. 없으면 404
    if(deleteResult.affected === 0)
    {
      throw new NotFoundException('찾는 재판이 없습니다. 또는 이미 삭제되었습니다.')
    }
    // 3. 트랜 잭션 종료
    await queryRunner.commitTransaction();

   }catch(error){

    await queryRunner.rollbackTransaction();
  
    console.log("vs 삭제 오류:", error)
  
    throw new InternalServerErrorException(
      "vs 삭제 중 오류가 발생했습니다."
      )
    } finally {
  
      await queryRunner.release()
  
    }
  }


  // 활성화된 투표가 맞는지 검사 매서드(가드에서 사용)
  async checkIsActiveGuard(trialId: number) {
    const trial = await this.trialsRepository.findOne({
      where: {
        id: trialId,
      }
    })

    if(!trial || trial.is_time_over == true) {
      throw new Error("타임 아웃된 투표입니다.")
    }

    return trial
  }
}
