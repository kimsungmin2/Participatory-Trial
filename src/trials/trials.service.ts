import { Injectable, InternalServerErrorException, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { CreateTrialDto } from './dto/create-trial.dto';
import { UpdateTrialDto } from './dto/update-trial.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Trials } from './entities/trial.entity';
import { DataSource, Repository } from 'typeorm';
import { firstValueFrom, map, retry } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class TrialsService {
  constructor(
    @InjectRepository(Trials)
    private trialsRepository: Repository<Trials>,
    private dataSource: DataSource,
    private httpService: HttpService
  ){}

  async createTrial(userId: number, createTrialDto: CreateTrialDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED');
    try{
      // 1. Dto에서 title, content 뽑아내기
      const { title, content } = createTrialDto;

      // 2. 객체에 넣기
      const data = {
        title,
        content,
        userId
      }

      // 3. 재판 생성
      const newTrial = queryRunner.manager.create(Trials, data)

      // 4. 재판 저장
      const savedTrial = await queryRunner.manager.save(Trials, newTrial)

      // 5. 트랜 잭션 종료
      await queryRunner.commitTransaction();
      
      return savedTrial

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


  async updateTrials(userId: number, trialsId: number, updateTrialDto: UpdateTrialDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED');
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

  async deleteTrials(id: number) {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED')
    try{
      // 1. 삭제하려는 재판이 존재하는지 검사
      const trials = await this.findOneByTrialsId(+id);

      // 2. 재판 삭제
      await queryRunner.manager.remove(trials);

      // 5. 트랜잭션 종료
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


  // 판례 조회
  async getCaseDetails(caseId: string) {
    
  }
}
