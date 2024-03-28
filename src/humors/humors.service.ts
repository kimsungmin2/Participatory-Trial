import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateHumorBoardDto } from './dto/create-humor.dto';
import { UpdateHumorDto } from './dto/update-humor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { HumorBoards } from './entities/humor-board.entity';
import { Repository } from 'typeorm';
import { Users } from '../users/entities/user.entity';

@Injectable()
export class HumorsService {
  constructor(
    @InjectRepository(HumorBoards)
    private HumorBoardRepository: Repository<HumorBoards>,
  ) {}

  //게시물 생성

  async createHumorBoard(createHumorBoardDto: CreateHumorBoardDto) {
    const createdBoard = await this.HumorBoardRepository.save({
      id: 1,
      ...CreateHumorBoardDto,
    });
    return createdBoard;
  }

  //모든 게시물 조회(페이지네이션)

  async getAllHumorBoards() {
    return await this.HumorBoardRepository.find();
  }

  //단건 게시물 조회

  async findOneHumorBoard(id: number) {
    const findHumorBoard = await this.HumorBoardRepository.findOneBy({ id });
    if (!findHumorBoard)
      throw new NotFoundException(`${id}번 게시물을 찾을 수 없습니다.`);
    return findHumorBoard;
  }

  //게시물 업데이트

  async updateHumorBoard(
    id: number,
    updateHumorDto: UpdateHumorDto,
  ): Promise<HumorBoards> {
    const findHumorBoard = await this.findOneHumorBoard(id);
    // if (findHumorBoard.userId !== user.id) {
    //   throw new ForbiddenException('해당 게시물을 수정할 권한이 없습니다.');
    // }
    const updatedHumorBoardDao = this.HumorBoardRepository.merge(
      findHumorBoard,
      updateHumorDto,
    );
    try {
      await this.HumorBoardRepository.save(updatedHumorBoardDao);
    } catch (err) {
      throw new InternalServerErrorException(
        '예기치 못한 오류로 업데이트에 실패했습니다. 다시 시도해주십시오.',
      );
    }
    return updatedHumorBoardDao;
  }

  //게시물 삭제

  async removeHumorBoard(id: number) {
    const findHumorBoard = await this.findOneHumorBoard(id);
    // if (findHumorBoard.userId !== user.id) {
    //   throw new ForbiddenException('해당 게시물을 삭제할 권한이 없습니다.');
    // }
    const deletedHumorBoard = await this.HumorBoardRepository.delete({
      id,
    });
    if (deletedHumorBoard.affected !== 1) {
      throw new InternalServerErrorException(
        '예기지 못한 오류로 삭제에 실패했습니다. 다시 시도해주십시오.',
      );
    }
    return deletedHumorBoard;
  }
}
