import { Injectable, InternalServerErrorException, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { CreateTrialDto } from './dto/create-trial.dto';
import { UpdateTrialDto } from './dto/update-trial.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Trials } from './entities/trial.entity';
import { DataSource, Like, Repository } from 'typeorm';
import { firstValueFrom, map, retry } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { PanryeInfo } from './entities/panryedata.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class TrialsService {
  constructor(
    @InjectRepository(Trials)
    private trialsRepository: Repository<Trials>,
    @InjectRepository(PanryeInfo)
    private panryeRepository: Repository<PanryeInfo>,
    private dataSource: DataSource,
    private httpService: HttpService,
    @InjectQueue('trial-queue') private trialQueue: Queue
  ){}

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

  // 
}
