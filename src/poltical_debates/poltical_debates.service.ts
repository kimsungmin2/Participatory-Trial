import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from '../users/entities/user.entity';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';
import { UpdatePolticalDebateDto } from './dto/update-poltical_debate.dto';
import { PolticalDebateBoards } from './entities/poltical_debate.entity';
import { UserInfos } from '../users/entities/user-info.entity';
import { PaginationQueryDto } from '../humors/dto/get-humorBoard.dto';
import { S3Service } from '../s3/s3.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { BoardType } from '../s3/board-type';

@Injectable()
export class PolticalDebatesService {
  constructor(
    @InjectRepository(PolticalDebateBoards)
    private readonly polticalDebateRepository: Repository<PolticalDebateBoards>,
    private s3Service: S3Service,
    @InjectRedis()
    private readonly redis: Redis,
  ) {}
  async create(
    userInfo: UserInfos,
    createPolticalDebateDto: CreatePolticalDebateDto,
    files: Express.Multer.File[],
  ) {
    let uploadResult: string[] = [];
    if (files.length !== 0) {
      const uploadResults = await this.s3Service.saveImages(
        files,
        BoardType.PolticalDebate,
      );
      for (let i = 0; i < uploadResults.length; i++) {
        uploadResult.push(uploadResults[i].imageUrl);
      }
    }
    const imageUrl =
      uploadResult.length > 0 ? JSON.stringify(uploadResult) : null;
    try {
      const createdBoard = await this.polticalDebateRepository.save({
        userId: userInfo.id,
        ...createPolticalDebateDto,
        imageUrl,
      });
      return createdBoard;
    } catch {
      throw new InternalServerErrorException(
        '예기지 못한 오류로 게시물 생성에 실패했습니다. 다시 시도해주세요.',
      );
    }
  }

  async findAll(paginationQueryDto: PaginationQueryDto) {
    let polticalDebateBoards: PolticalDebateBoards[];
    const totalItems = await this.polticalDebateRepository.count();
    try {
      const { page, limit } = paginationQueryDto;
      const skip = (page - 1) * limit;
      polticalDebateBoards = await this.polticalDebateRepository.find({
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
    if (polticalDebateBoards.length === 0) {
      throw new NotFoundException('더이상 게시물이 없습니다!');
    }
    return {
      polticalDebateBoards,
      totalItems,
    };
  }

  async findMyBoards(userId: number) {
    return this.polticalDebateRepository.find({
      where: { userId },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const findPolticalDebateBoard = await this.polticalDebateRepository.findOne(
      {
        where: { id },
        relations: ['polticalDebateComments'],
      },
    );
    if (!findPolticalDebateBoard) {
      throw new NotFoundException(`${id}번 게시물을 찾을 수 없습니다.`);
    }
    let cachedView: number;
    try {
      cachedView = await this.redis.incr(`poticalDebate:${id}:view`);
    } catch (err) {
      throw new InternalServerErrorException(
        '요청을 처리하는 도중 오류가 발생했습니다.',
      );
    }

    return {
      ...findPolticalDebateBoard,
      view: findPolticalDebateBoard.view + cachedView,
    };
  }

  async update(
    userInfo: UserInfos,
    id: number,
    updatePolticalDebateDto: UpdatePolticalDebateDto,
  ) {
    const userId = userInfo.id;

    const polticalDebateBoard = await this.polticalDebateRepository.findOne({
      where: { id },
    });

    if (!polticalDebateBoard) {
      throw new NotFoundException('정치 토론 게시판을 찾을 수 없습니다.');
    }

    if (polticalDebateBoard.userId !== userId) {
      throw new UnauthorizedException('게시판을 수정할 권한이 없습니다.');
    }

    const existingViewCount = polticalDebateBoard.view;

    polticalDebateBoard.userId = userId;
    polticalDebateBoard.title = updatePolticalDebateDto.title;
    polticalDebateBoard.content = updatePolticalDebateDto.content;
    polticalDebateBoard.view = existingViewCount;

    const updatedBoard =
      await this.polticalDebateRepository.save(polticalDebateBoard);
    return updatedBoard;
  }

  async delete(userInfo: UserInfos, id: number) {
    console.log(userInfo);
    const userId = userInfo.id;

    const politicalDebateBoard = await this.polticalDebateRepository.findOne({
      where: { id },
    });

    if (!politicalDebateBoard) {
      throw new NotFoundException('정치 토론 게시판을 찾을 수 없습니다.');
    }

    if (politicalDebateBoard.userId !== userId) {
      throw new UnauthorizedException('게시판를 삭제할 권한이 없습니다.');
    }

    const deleteBoard = await this.polticalDebateRepository.softDelete(
      politicalDebateBoard.id,
    );

    return deleteBoard;
  }
}
