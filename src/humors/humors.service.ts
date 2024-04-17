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
import { S3Service } from '../s3/s3.service';
import { PaginationQueryDto } from './dto/get-humorBoard.dto';
import { BoardType } from '../s3/board-type';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { cache } from 'joi';
import { VoteTitleDto } from 'src/trials/vote/dto/voteDto';
import { HumorVotes } from './entities/HumorVote.entity';

@Injectable()
export class HumorsService {
  constructor(
    @InjectRepository(HumorBoards)
    private HumorBoardRepository: Repository<HumorBoards>,
    @InjectRepository(HumorVotes)
    private HumorVotesRepository: Repository<HumorVotes>,
    private s3Service: S3Service,
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  //게시물 생성
  /**
   *
   * @deprecated 아마 게시물과 투표를 한번에 만들어야 해서 새로 만들어야 할겁니다. 밑에 새로 만들어 놨어요
   */
  async createHumorBoard(
    createHumorBoardDto: CreateHumorBoardDto,
    user: Users,
    files: Express.Multer.File[],
  ): Promise<HumorBoards> {
    let uploadResult: string[] = [];
    if (files.length !== 0) {
      const uploadResults = await this.s3Service.saveImages(
        files,
        BoardType.Humor,
      );
      for (let i = 0; i < uploadResults.length; i++) {
        uploadResult.push(uploadResults[i].imageUrl);
      }
    }
    const imageUrl =
      uploadResult.length > 0 ? JSON.stringify(uploadResult) : null;
    try {
      const createdBoard = await this.HumorBoardRepository.save({
        userId: user.id,
        ...createHumorBoardDto,
        imageUrl,
      });
      return createdBoard;
    } catch {
      throw new InternalServerErrorException(
        '예기지 못한 오류로 게시물 생성에 실패했습니다. 다시 시도해주세요.',
      );
    }
  }

  /**
   * 유머게시판 투표와 게시물 동시에 생성함수
   *
   * @param createHumorBoardDto title, content
   * @param voteTitleDto title1, title2
   * @param user user
   * @param files 파일
   * @returns
   */
  async createHumorBoardAndVotes(
    createHumorBoardDto: CreateHumorBoardDto,
    voteTitleDto: VoteTitleDto,
    user: Users,
    files: Express.Multer.File[],
  ): Promise<HumorBoards> {
    let uploadResult: string[] = [];
    if (files.length !== 0) {
      const uploadResults = await this.s3Service.saveImages(
        files,
        BoardType.Humor,
      );
      for (let i = 0; i < uploadResults.length; i++) {
        uploadResult.push(uploadResults[i].imageUrl);
      }
    }
    const imageUrl =
      uploadResult.length > 0 ? JSON.stringify(uploadResult) : null;
    try {
      const createdBoard = await this.HumorBoardRepository.save({
        userId: user.id,
        ...createHumorBoardDto,
        imageUrl,
      });

      const createdVotes = await this.HumorVotesRepository.save({
        humorId: createdBoard.id,
        ...voteTitleDto,
      });
      console.log(createdVotes);

      return createdBoard;
    } catch {
      throw new InternalServerErrorException(
        '예기지 못한 오류로 게시물 생성에 실패했습니다. 다시 시도해주세요.',
      );
    }
  }

  //모든 게시물 조회(페이지네이션)

  async getAllHumorBoards(paginationQueryDto: PaginationQueryDto) {
    let humorBoards: HumorBoards[];

    const totalItems = await this.HumorBoardRepository.count();
    try {
      const { page, limit } = paginationQueryDto;
      const skip = (page - 1) * limit;
      humorBoards = await this.HumorBoardRepository.find({
        skip,
        take: limit,
        order: {
          createdAt: 'DESC',
        },
      });
    } catch (err) {
      console.log(err.message);
      throw new InternalServerErrorException(
        '게시물을 불러오는 도중 오류가 발생했습니다.',
      );
    }
    return {
      humorBoards,
      totalItems,
    };
  }

  //단건 게시물 조회
  //조회수 기능 추가

  async findOneHumorBoard(id: number) {
    const findHumorBoard = await this.HumorBoardRepository.findOneBy({ id });
    if (!findHumorBoard)
      throw new NotFoundException(`${id}번 게시물을 찾을 수 없습니다.`);
    return findHumorBoard;
  }

  //조회수를 증가시키고 데이터를 반환
  async findOneHumorBoardWithIncreaseView(id: number): Promise<HumorBoards> {
    const findHumorBoard: HumorBoards = await this.HumorBoardRepository.findOne(
      {
        where: { id },
        relations: ['humorComment', 'humorVotes'],
      },
    );
    if (!findHumorBoard) {
      throw new NotFoundException(`${id}번 게시물을 찾을 수 없습니다.`);
    }
    let cachedView: number;
    try {
      cachedView = await this.redis.incr(`humors:${id}:view`);
    } catch (err) {
      throw new InternalServerErrorException(
        '요청을 처리하는 도중 오류가 발생했습니다.',
      );
    }
    console.log(findHumorBoard);

    return {
      ...findHumorBoard,
      view: findHumorBoard.view + cachedView,
    };
  }

  //게시물 업데이트

  async updateHumorBoard(
    id: number,
    updateHumorDto: UpdateHumorDto,
    user: Users,
  ): Promise<HumorBoards> {
    const findHumorBoard = await this.findOneHumorBoard(id);
    if (findHumorBoard.userId !== user.id) {
      throw new ForbiddenException('해당 게시물을 수정할 권한이 없습니다.');
    }
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

  async deleteHumorBoard(id: number, user: Users) {
    const findHumorBoard = await this.findOneHumorBoard(id);
    if (findHumorBoard.userId !== user.id) {
      throw new ForbiddenException('해당 게시물을 삭제할 권한이 없습니다.');
    }
    const deletedHumorBoard = await this.HumorBoardRepository.softDelete(id);
    if (deletedHumorBoard.affected !== 1) {
      throw new InternalServerErrorException(
        '예기지 못한 오류로 삭제에 실패했습니다. 다시 시도해주십시오.',
      );
    }
    return deletedHumorBoard;
  }
}
