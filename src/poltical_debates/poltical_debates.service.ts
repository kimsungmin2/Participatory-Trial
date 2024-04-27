import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';
import { UpdatePolticalDebateDto } from './dto/update-poltical_debate.dto';
import { PolticalDebateBoards } from './entities/poltical_debate.entity';
import { UserInfos } from '../users/entities/user-info.entity';
import { PolticalDebateVotes } from './entities/polticalVote.entity';
import { S3Service } from '../s3/s3.service';
import { BoardType } from '../s3/type/board-type';
import { PaginationQueryDto } from '../humors/dto/get-humorBoard.dto';
import { VoteTitleDto } from '../trials/vote/dto/voteDto';
import { UpdateVoteDto } from '../trials/vote/dto/updateDto';
import { RedisService } from '../cache/redis.service';
import { UsersService } from '../users/users.service';
import { Users } from '../users/entities/user.entity';

@Injectable()
export class PolticalDebatesService {
  static createSubject(polticalId: number, voteDto: VoteTitleDto): any {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(PolticalDebateBoards)
    private readonly polticalDebateRepository: Repository<PolticalDebateBoards>,
    @InjectRepository(PolticalDebateVotes)
    private readonly polticalVoteRepository: Repository<PolticalDebateVotes>,
    private readonly dataSource: DataSource,
    private s3Service: S3Service,
    private readonly redisService: RedisService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * 투표 정치 게시물 생성 함수
   * @deprecated 이제 이거 안씀니다.... 투표 기능 한번에 합쳐야 해요!
   *
   */
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

  /**
   * 정치 게시판 게시물과 투표 동시에 생성해주는 함수
   * @param userId
   * @param createPolticalDebateDto title, content
   * @param voteTitleDto title1, title2
   * @returns
   */
  async createBothBoardandVote(
    userId: number,
    createPolticalDebateDto: CreatePolticalDebateDto,
    voteTitleDto: VoteTitleDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();
    try {
      const { title, content } = createPolticalDebateDto;
      const { title1, title2 } = voteTitleDto;

      const data = {
        title,
        content,
        userId,
      };

      const newBoard = queryRunner.manager.create(PolticalDebateBoards, data);

      const savedBoard = await queryRunner.manager.save(
        PolticalDebateBoards,
        newBoard,
      );
      const polticalId = savedBoard.id;

      const vote = {
        title1,
        title2,
        polticalId,
      };

      const newVote = queryRunner.manager.create(PolticalDebateVotes, vote);

      const savedVote = await queryRunner.manager.save(
        PolticalDebateVotes,
        newVote,
      );

      await queryRunner.commitTransaction();

      return { newVote, savedVote };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.log('정치 게시물 생성 에러:', error);

      throw new InternalServerErrorException(
        '정치 게시물 중 오류가 발생했습니다.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async checkPostOwner(id: number, user: Users) {
    const post = await this.findBoardbyId(id);
    if (post.userId !== user.id) {
      throw new ForbiddenException('권한이 없습니다.');
    }
    return post;
  }

  async findAll() {
    const findAllPolticalDebateBoard = await this.polticalDebateRepository.find(
      {
        order: { id: 'ASC' },
      },
    );

    return findAllPolticalDebateBoard;
  }

  async findAllWithPaginateBoard(paginationQueryDto: PaginationQueryDto) {
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
      const polticalDbatesBoardsWithUserNames = await Promise.all(
        polticalDebateBoards.map(async (polticalBoard) => {
          const userName = await this.usersService.findById(
            polticalBoard.userId,
          );
          return {
            ...polticalBoard,
            userName: userName.nickName,
          };
        }),
      );

      return {
        polticalDebateBoards: polticalDbatesBoardsWithUserNames,
        totalItems,
      };
    } catch (err) {
      throw new InternalServerErrorException(
        '게시물을 불러오는 도중 오류가 발생했습니다.',
      );
    }
  }

  async findMyBoards(userId: number) {
    return this.polticalDebateRepository.find({
      where: { userId },
      order: { id: 'ASC' },
    });
  }

  async findBoardbyId(id: number) {
    const board = await this.polticalDebateRepository.findOneBy({ id });

    if (!board) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }
    return board;
  }

  async findOne(id: number) {
    const findPolticalDebateBoard = await this.polticalDebateRepository.findOne(
      {
        where: { id },
        relations: ['polticalDebateComments', 'polticalDebateVotes'],
      },
    );
    if (!findPolticalDebateBoard) {
      throw new NotFoundException(`${id}번 게시물을 찾을 수 없습니다.`);
    }
    let cachedView: number;
    try {
      cachedView = await this.redisService
        .getCluster()
        .incr(`poticalDebate:${id}:view`);
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
    const userId = userInfo.id;

    const politicalDebateBoard = await this.polticalDebateRepository.findOne({
      where: { id },
    });

    if (!politicalDebateBoard) {
      throw new NotFoundException('정치 토론 게시판을 찾을 수 없습니다.');
    }

    if (politicalDebateBoard.userId !== userId) {
      throw new ForbiddenException('게시판를 삭제할 권한이 없습니다.');
    }

    const deleteBoard = await this.polticalDebateRepository.softDelete(
      politicalDebateBoard.id,
    );

    return deleteBoard;
  }

  // 정치 게시만 투표 vs 만들기 매서드
  async createSubject(polticalId: number, voteDto: VoteTitleDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 객체 분해 할당 시킴 Dto
      const { title1, title2 } = voteDto;

      // 2. 객체에 담음(담는 이유 한번에 저장하면 빠름)
      const vote = {
        title1,
        title2,
        polticalId,
      };

      // 3. 객체 만든거 생성
      const voteSubject = queryRunner.manager.create(PolticalDebateVotes, vote);

      // 4. 만든 객체 저장
      await queryRunner.manager.save(PolticalDebateVotes, voteSubject);

      // 5. 트랜 잭션 종료
      await queryRunner.commitTransaction();

      // 6. 잘 생성되면 vote 리턴
      return vote;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('vs 생성 중 오류가 발생했습니다.');
    } finally {
      await queryRunner.release();
    }
  }

  // 정치 게시만 투표 vs 수정 매서드
  async updateSubject(polticalVoteId: number, updateVoteDto: UpdateVoteDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 1. 수정할 투표 찾기
      const vote = await queryRunner.manager.findOne(PolticalDebateVotes, {
        where: {
          id: polticalVoteId,
        },
      });

      // 2. 찾은 객체 업데이트(이렇게 하면 DB 한번만 들어가면됨)
      Object.assign(vote, updateVoteDto);

      // 3. 객체 저장
      await queryRunner.manager.save(PolticalDebateVotes, vote);

      // 4. 트랜 잭션 종료

      await queryRunner.commitTransaction();

      return vote;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.log('vs 수정 오류:', error);

      throw new InternalServerErrorException('vs 수정 중 오류가 발생했습니다.');
    } finally {
      await queryRunner.release();
    }
  }

  // 정치 게시만 투표 vs 삭제 매서드
  async deleteVote(polticalVoteId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 1. 재판 삭제(일반적으로 remove보다 delete가 더 빠르다.)
      const deleteResult = await queryRunner.manager.delete(
        PolticalDebateVotes,
        {
          id: polticalVoteId,
        },
      );

      // 2. 없으면 404
      if (deleteResult.affected === 0) {
        throw new NotFoundException(
          '찾는 정치 게시판 투표가 없습니다. 또는 이미 삭제되었습니다.',
        );
      }
      // 3. 트랜 잭션 종료
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.log('vs 삭제 오류:', error);

      throw new InternalServerErrorException('vs 삭제 중 오류가 발생했습니다.');
    } finally {
      await queryRunner.release();
    }
  }

  // Top 10 humors
  async findTop10PolticalByVotes() {
    return this.polticalVoteRepository
      .createQueryBuilder('polticalDebateVotes')
      .leftJoin('polticalDebateVotes.eachPolticalVote', 'eachPolticalVote')
      .groupBy('polticalDebateVotes.id')
      .select('polticalDebateVotes.id', 'id')
      .addSelect('polticalDebateVotes.title1', 'title1')
      .addSelect('polticalDebateVotes.title2', 'title2')
      .addSelect(
        'SUM(CASE WHEN eachPolticalVote.voteFor = true THEN 1 ELSE 0 END)',
        'votesCount1',
      )
      .addSelect(
        'SUM(CASE WHEN eachPolticalVote.voteFor = false THEN 1 ELSE 0 END)',
        'votesCount2',
      )
      .orderBy(
        'SUM(CASE WHEN eachPolticalVote.voteFor = true THEN 1 ELSE 0 END) + SUM(CASE WHEN eachPolticalVote.voteFor = false THEN 1 ELSE 0 END)',
        'DESC',
      )
      .take(10)
      .getRawMany();
  }
}
