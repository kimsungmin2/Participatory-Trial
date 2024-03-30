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

  // 명예의 전당
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

    // 투표 기반으로 명예의 전당 집계
    const hallOfFameData = this.aggVotesForHallOfFame(lastWeekVotes)

    await this.updateHallOfFameDatabase(hallOfFameData);
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
  // 투표 데이터 집계 매서드
  private async aggVotesForHallOfFame(votes: Votes[]){
    const { start, end } = this.getThisMonthRange();

    const candidates = await this.votesRepository
    .createQueryBuilder("vote")
    .select(['vote.id', 'vote.title1', 'vote.title2'])
    .addSelect("vote.voteCount1 + vote.voteCount2", "totalVotes")
    .where('vote.createdAt BETWEEN :start AND :end', { start: start.toISOString(), end: end.toISOString() })
    .having("totalVotes >= :minTotalVotes", { minTotalVotes: 100 }) // 투표 수 100 이상인 것만 조회
    .groupBy("vote.id")
    .getRawMany();

    return candidates
  }

  // DB에 명예의 전당 데이터를 업데이트(배열형태로 받아서 한번에 저장)
  private async updateHallOfFameDatabase(hallOfFameData: any){
    // 한번에 저장
    const newHallOfFameEntries = hallOfFameData.map(data => {
      const newHallOfFameEntry = new TrialHallOfFames();
      newHallOfFameEntry.id = data.id // vote table의 id임다
      newHallOfFameEntry.userId = data.trial.userId // vote에는 userId가 없으므로 일대일관계인 trial에 가서 userId 가져옴
      newHallOfFameEntry.title = data.title1 + 'Vs' + data.title2
      newHallOfFameEntry.content = data.trial.content // vote에는 content가 없으므로 일대일관계인 trial에 가서 content 가져옴
      newHallOfFameEntry.createdAt = new Date();
      newHallOfFameEntry.updatedAt = new Date();
      return newHallOfFameEntry;
    });
      // DB에 새로운 명전 저장
      await this.trialHallOfFamesRepository.save(newHallOfFameEntries)

    }
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

// 유저Id로 모든 재판 찾기(유저 내 재판 조회)
async findByUserTrials(userId: number) {
  const trials = await this.trialsRepository.findOneBy({ userId });
  if(!trials) {
    throw new NotFoundException("해당 유저의 재판이 없습니다.")
  }
    return trials;
  }

  // 모든 재판 조회(유저/비회원 구분 X)
  async findAllTrials() {
    const allTrials = await this.trialsRepository.find()
    if(!allTrials){
      throw new NotFoundException("조회할 재판이 없습니다.")
    }

    return allTrials
  }


    // 특정 재판 조회(회원/비회원 구분 X)
  async findOneByTrialsId(id: number) {

    const OneTrials = await this.trialsRepository.findOneBy({ id })

    if(!OneTrials){
      throw new NotFoundException("검색한 재판이 없습니다.")
    }

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
      const trials = await this.findOneByTrialsId(+id);

      // 2. 재판 삭제
      await queryRunner.manager.remove(trials);

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

  // 내 재판인지 찾기
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


  // 모든 판례 조회
  async getAllDetails(cursor: number, limit: number) {
    const queryBuilder = this.panryeRepository.createQueryBuilder('panrye')
      .orderBy('panrye.판례정보일련번호', 'ASC')
      .limit(limit);

      if(cursor){
        queryBuilder.where('panrye.판례정보일련번호 > :cursor', { cursor })
      }

      return queryBuilder.getMany();
  }

  // 판례 조회
  async findKeyWordDetails(name: string) {
    return this.panryeRepository.find({
      where: {
        판결유형: Like(`%${name}%`),
      }
    })
  }

  // 판결 유형으로 조회
  async findBypanguelcaseDetails(name: string) {
    return this.panryeRepository.find({
      where: {
        판결유형: name,
      }
    })
  }

  // 타임아웃되면 업데이트
  async updateTimeDone(trialId: number) {
    await this.trialsRepository.update(trialId, { is_time_over: true })
  }


  // 투표 주제 만들기 함수
  async createSubject(trialId: number, voteDto: VoteDto){
    const { title1, title2 } = voteDto
    const vote = {
      title1,
      title2,
      trialId
    }

    const voteSubject = this.votesRepository.create(vote)

    await this.votesRepository.save(voteSubject)

    return vote
  }

  // 활성화된 투표가 맞는지 검사는 함수
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

  // 투표 기획 수정 함수
  async updateSubject(voteId: number, updateVoteDto: UpdateVoteDto)
  {
    const vote = await this.votesRepository.findOne({
      where: {
        id: voteId,
      }
    })

    Object.assign(vote, updateVoteDto)

    await this.votesRepository.save(vote)

    return vote
  }

  // 투표 vs 삭제 함수
  async deleteVote(voteId: number)
  {
    const vote = await this.votesRepository.findOne({
      where: {
        id: voteId,
      }
    })
    // 2. 재판 삭제
    await this.votesRepository.remove(vote);
  }
}
