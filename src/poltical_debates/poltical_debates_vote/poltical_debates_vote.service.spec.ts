import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { PolticalDebateVotes } from '../entities/polticalVote.entity';
import { EachPolticalVote } from '../entities/userVoteOfPoltical_debate.entity';
import { PolticalVotesService } from './poltical_debates_vote.service';

describe('PolticalDebatesVoteService', () => {
  let polticalDebatesVoteService: PolticalVotesService;
  let eachPolticalVoteRepository: Repository<EachPolticalVote>;
  let dataSource: DataSource;
  let mockQueryRunner: QueryRunner;
  let mockRepository: Partial<
    Record<keyof Repository<EachPolticalVote>, jest.Mock>
  >;
  let mockDataSource: Partial<Record<keyof DataSource, jest.Mock>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolticalVotesService,
        DataSource,
        {
          provide: Repository,
          useClass: jest.fn(() => ({
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          })),
        },
        {
          provide: EachPolticalVote,
          useFactory: () => ({
            id: 1,
            userId: 1,
            ip: '127.0.0.1',
            polticalVoteId: 1,
            voteFor: true,
          }),
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(() => ({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: {
                create: jest.fn(),
                save: jest.fn(),
                findOne: jest.fn(),
                delete: jest.fn(),
                update: jest.fn(),
              },
            })),
          },
        },
      ],
    }).compile();

    polticalDebatesVoteService =
      module.get<PolticalVotesService>(PolticalVotesService);
    eachPolticalVoteRepository =
      module.get<Repository<EachPolticalVote>>(Repository);
    dataSource = module.get<DataSource>(DataSource);
    mockQueryRunner = dataSource.createQueryRunner();
    mockRepository = module.get('EachPolticalVoteRepository');
    mockDataSource = module.get('DataSource');
  });

  it('should be defined', () => {
    expect(polticalDebatesVoteService).toBeDefined();
  });

  it('should be defined', () => {
    expect(eachPolticalVoteRepository).toBeDefined();
  });

  it('should be defined', () => {
    expect(dataSource).toBeDefined();
  });

  describe('addPolticalVoteUserorNanUser', () => {
    it('성공', async () => {
      const result =
        await polticalDebatesVoteService.addPolticalVoteUserorNanUser(
          '127.0.0.1',
          null,
          1,
          true,
        );
      expect(result).toEqual({ VoteOk: true });
    });

    it('실패: 트랜잭션 롤백', async () => {
      mockQueryRunner.manager.findOneBy = jest.fn().mockResolvedValue(null);
      try {
        await polticalDebatesVoteService.addPolticalVoteUserorNanUser(
          '127.0.0.1',
          1,
          1,
          true,
        );
      } catch (error) {
        expect(mockQueryRunner.rollbackTransaction).toBeCalledTimes(1);
      }
    });
  });

  // describe('canselEachVote', () => {
  //   it('성공', async () => {
  //     const result = await polticalDebatesVoteService.canselEachVote(1);
  //     expect(result).toBeDefined();
  //   });

  //   it('실패: NotFoundException', async () => {
  //     eachPolticalVoteRepository.delete.mockResolvedValue({ affected: 0 });

  //     try {
  //       await polticalDebatesVoteService.canselEachVote(1);
  //       fail('NotFoundException should have been thrown');
  //     } catch (error) {
  //       expect(error).toBeInstanceOf(NotFoundException);
  //       expect(error.message).toEqual(
  //         '찾는 재판이 없습니다. 또는 이미 삭제되었습니다.',
  //       );
  //     }
  //   });
  // });

  // describe('checkIsUserVoteGuard', () => {
  //   it('성공', async () => {
  //     const result = await polticalDebatesVoteService.checkIsUserVoteGuard(
  //       1,
  //       1,
  //     );
  //     expect(result).toBeDefined();
  //   });
  // });

  // describe('getUserVoteCounts', () => {
  //   it('성공', async () => {
  //     const polticalVoteId = 1;
  //     const voteForTrue = 10;
  //     const voteForFalse = 5;
  //     const totalVotes = voteForTrue + voteForFalse;
  //     const vote1Percentage =
  //       totalVotes > 0 ? (voteForTrue / totalVotes) * 100 : 0;
  //     const vote2Percentage =
  //       totalVotes > 0 ? (voteForFalse / totalVotes) * 100 : 0;

  //     mockRepository.createQueryBuilder().getRawOne.mockResolvedValue({
  //       voteForTrue: voteForTrue.toString(),
  //       voteForFalse: voteForFalse.toString(),
  //     });

  //     const result =
  //       await polticalDebatesVoteService.getUserVoteCounts(polticalVoteId);

  //     expect(result).toEqual({
  //       vote1Percentage: `${vote1Percentage.toFixed(2)}%`,
  //       vote2Percentage: `${vote2Percentage.toFixed(2)}%`,
  //       totalVotes: totalVotes,
  //     });
  //   });
  // });

  // describe('getVoteCounts', () => {
  //   it('성공', async () => {
  //     const polticalVoteId = 1;
  //     const voteForTrue = 10;
  //     const voteForFalse = 5;
  //     const totalVotes = voteForTrue + voteForFalse;
  //     const vote1Percentage =
  //       totalVotes > 0 ? (voteForTrue / totalVotes) * 100 : 0;
  //     const vote2Percentage =
  //       totalVotes > 0 ? (voteForFalse / totalVotes) * 100 : 0;

  //     mockRepository.createQueryBuilder().getRawOne.mockResolvedValue({
  //       voteForTrue: voteForTrue.toString(),
  //       voteForFalse: voteForFalse.toString(),
  //     });

  //     const result =
  //       await polticalDebatesVoteService.getVoteCounts(polticalVoteId);

  //     expect(result).toEqual({
  //       vote1Percentage: `${vote1Percentage.toFixed(2)}%`,
  //       vote2Percentage: `${vote2Percentage.toFixed(2)}%`,
  //     });
  //   });
  // });

  // describe('updateVoteCounts', () => {
  //   it('성공', async () => {
  //     const polticalVoteId = 1;
  //     const voteCount1 = 10;
  //     const voteCount2 = 5;

  //     mockDataSource
  //       .getRepository()
  //       .createQueryBuilder()
  //       .getRawOne.mockResolvedValue({
  //         voteCount1: voteCount1.toString(),
  //         voteCount2: voteCount2.toString(),
  //       });

  //     await polticalDebatesVoteService.updateVoteCounts(polticalVoteId);

  //     expect(
  //       mockDataSource.getRepository(PolticalDebateVotes).update,
  //     ).toHaveBeenCalledWith(
  //       { id: polticalVoteId },
  //       { voteCount1, voteCount2 },
  //     );
  //   });
  // });
});
