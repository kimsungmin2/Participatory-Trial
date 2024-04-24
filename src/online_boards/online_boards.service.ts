import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateOnlineBoardDto } from './dto/create-online_board.dto';
import { UpdateOnlineBoardDto } from './dto/update-online_board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OnlineBoards } from './entities/online_board.entity';
import { Like, Repository } from 'typeorm';
import { FindAllOnlineBoardDto } from './dto/findAll-online_board.dto';
import { UserInfos } from '../users/entities/user-info.entity';
import { PaginationQueryDto } from '../humors/dto/get-humorBoard.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { S3Service } from '../s3/s3.service';
import { BoardType } from '../s3/board-type';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class OnlineBoardsService {
  constructor(
    @InjectRepository(OnlineBoards)
    private readonly onlineBoardsRepository: Repository<OnlineBoards>,
    private readonly s3Service: S3Service,
    private readonly redisService: RedisService,
  ) {}

  // 자유게시판 게시글 작성
  async createBoard(
    createOnlineBoardDto: CreateOnlineBoardDto,
    userInfo: UserInfos,
    files: Express.Multer.File[],
  ): Promise<OnlineBoards> {
    console.log(createOnlineBoardDto);
    let uploadResult: string[] = [];
    if (files.length !== 0) {
      const uploadResults = await this.s3Service.saveImages(
        files,
        BoardType.OnlineBoard,
      );
      for (let i = 0; i < uploadResults.length; i++) {
        uploadResult.push(uploadResults[i].imageUrl);
      }
    }
    const imageUrl =
      uploadResult.length > 0 ? JSON.stringify(uploadResult) : null;
    try {
      const createdBoard = await this.onlineBoardsRepository.save({
        userId: userInfo.id,
        ...createOnlineBoardDto,
        imageUrl,
      });
      return createdBoard;
    } catch {
      throw new InternalServerErrorException(
        '예기지 못한 오류로 게시물 생성에 실패했습니다. 다시 시도해주세요.',
      );
    }
  }
  // 게시판 모두/키워드만 조회
  async findAllBoard(keyword: string) {
    const boards = await this.onlineBoardsRepository.find({
      where: {
        ...(keyword && { title: Like(`%${keyword}%`) }),
      },
      select: {
        id: true,
        userId: true,
        title: true,
        view: true,
        like: true,
        created_at: true,
      },
    });

    return boards;
  }

  //게시판 모두 조회(페이지네이션)
  async getPaginateBoards(paginationQueryDto: PaginationQueryDto) {
    let onlineBoards: OnlineBoards[];
    const totalItems: number = await this.onlineBoardsRepository.count();
    try {
      const { page, limit } = paginationQueryDto;
      const skip = (page - 1) * limit;
      onlineBoards = await this.onlineBoardsRepository.find({
        skip,
        take: limit,
        order: {
          created_at: 'DESC',
        },
      });
    } catch (err) {
      console.log(err.message);
      throw new InternalServerErrorException(
        '게시물을 불러오는 도중 오류가 발생했습니다.',
      );
    }
    return {
      onlineBoards,
      totalItems,
    };
  }

  // 자유게시판 단건 조회
  async findBoard(id: number) {
    const board = await this.onlineBoardsRepository.findOne({
      where: { id },
      relations: { onlineBoardComment: true },
    });
    return board;
  }

  //조회수를 증가시키고 데이터를 반환
  async findOneOnlineBoardWithIncreaseView(id: number): Promise<OnlineBoards> {
    const findHumorBoard: OnlineBoards =
      await this.onlineBoardsRepository.findOne({
        where: { id },
        relations: ['onlineBoardComment'],
      });
    console.log(findHumorBoard);
    if (!findHumorBoard) {
      throw new NotFoundException(`${id}번 게시물을 찾을 수 없습니다.`);
    }
    let cachedView: number;
    try {
      cachedView = await this.redisService
        .getCluster()
        .incr(`online:${id}:view`);
    } catch (err) {
      throw new InternalServerErrorException(
        '요청을 처리하는 도중 오류가 발생했습니다.',
      );
    }

    return {
      ...findHumorBoard,
      view: findHumorBoard.view + cachedView,
    };
  }

  // 자유게시판 수정
  async updateBoard(id: number, updateOnlineBoardDto: UpdateOnlineBoardDto) {
    const foundBoard = await this.findBoardId(id);

    const { title, content } = updateOnlineBoardDto;

    const board = await this.onlineBoardsRepository.save({
      id: foundBoard.id,
      title,
      content,
    });

    return board;
  }

  // 자유게시판 삭제
  async removeBoard(id: number) {
    const foundBoard = await this.findBoardId(id);

    await this.onlineBoardsRepository.softDelete({ id: foundBoard.id });

    return `This action removes a #${id} onlineBoard`;
  }

  // 자유게시판 아이디 조회
  async findBoardId(boardId: number) {
    // console.log('boardId: ', boardId);
    const foundBoard = await this.onlineBoardsRepository.findOne({
      where: { id: boardId },
    });

    return foundBoard;
  }

  async verifyBoardOwner(userId: number, boardId: number) {
    return await this.onlineBoardsRepository.findOne({
      where: { userId, id: boardId },
    });
  }
}
