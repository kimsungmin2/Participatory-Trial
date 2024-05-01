import { Test, TestingModule } from '@nestjs/testing';
import { VotesService } from '../trials/vote/vote.service';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { EachVote } from '../trials/entities/Uservote.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Votes } from '../trials/entities/vote.entity';
import { PolticalVotesService } from '../poltical_debates_vote/poltical_debates_vote.service';
import { EachPolticalVote } from '../poltical_debates/entities/userVoteOfPoltical_debate.entity';

describe('PolticalDebatesVoteService', () => {
  let service: PolticalVotesService;
  let queryRunner: any;

  const mockEachVoteRepository = {
    delete: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    findOne: jest.fn(),
  };
  const mockDataSource = {
    createQueryRunner: jest.fn(() => queryRunner),
    getRepository: jest.fn(),
  };

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn(),
        findOneBy: jest
          .fn()
          .mockImplementation((entity, data) => Promise.resolve(data)),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolticalVotesService,
        {
          provide: getRepositoryToken(EachPolticalVote),
          useValue: mockEachVoteRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<PolticalVotesService>(PolticalVotesService);
  });
  describe('validationAndSaveVote', () => {
    it('should create a new vote if no existing vote is found', async () => {
      const voteDetails = {
        userId: 1,
        polticalVoteId: 1,
        voteFor: true,
      };
      const da = undefined;

      queryRunner.manager.findOneBy.mockResolvedValue(undefined);

      await service.validationAndSaveVote(
        voteDetails,
        queryRunner as QueryRunner,
      );

      expect(queryRunner.manager.findOneBy).toHaveBeenCalledWith(
        EachPolticalVote,
        {
          userId: 1,
          polticalVoteId: 1,
        },
      );

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        EachPolticalVote,
        da,
      );
    });

    it('should update an existing vote if the preference changes', async () => {
      const voteDetails = {
        userId: 1,
        ip: '127.0.0.1',
        polticalVoteId: 1,
        voteFor: false,
      };
      const existingVote = {
        id: 123,
        userId: 1,
        polticalVoteId: 1,
        voteFor: true,
      };

      queryRunner.manager.findOneBy.mockResolvedValue(existingVote);
      queryRunner.manager.save.mockImplementation((entity, data) =>
        Promise.resolve({ ...existingVote, ...data }),
      );

      const result = await service.validationAndSaveVote(
        voteDetails,
        queryRunner as QueryRunner,
      );

      expect(queryRunner.manager.findOneBy).toHaveBeenCalledWith(
        EachPolticalVote,
        {
          userId: 1,
          polticalVoteId: 1,
        },
      );
      expect(queryRunner.manager.save).toHaveBeenCalledWith(EachPolticalVote, {
        ...existingVote,
        voteFor: false,
      });
    });

    it('should cancel the vote if the same preference is repeated', async () => {
      const voteDetails = {
        userId: 1,
        polticalVoteId: 1,
        voteFor: true,
      };
      const existingVote = {
        id: 123,
        userId: 1,
        polticalVoteId: 1,
        voteFor: true,
      };

      queryRunner.manager.findOneBy.mockResolvedValue(existingVote);

      const result = await service.validationAndSaveVote(
        voteDetails,
        queryRunner as any,
      );
    });
  });
  describe('canselEachVote', () => {
    it('should delete a vote and return the result', async () => {
      const uservoteId = 1;
      const deleteResult = { affected: 1 };
      jest.spyOn(mockEachVoteRepository, 'delete').mockResolvedValue({
        affected: 1,
      });
      const result = await service.canselEachVote(uservoteId);

      expect(mockEachVoteRepository.delete).toHaveBeenCalledWith({
        id: uservoteId,
      });
      expect(result).toEqual(deleteResult);
    });

    it('should handle the case where the vote does not exist', async () => {
      const uservoteId = 999;
      const deleteResult = { affected: 0 };
      jest.spyOn(mockEachVoteRepository, 'delete').mockResolvedValue({
        affected: 0,
      });
      const result = await service.canselEachVote(uservoteId);

      expect(mockEachVoteRepository.delete).toHaveBeenCalledWith({
        id: uservoteId,
      });
      expect(result).toEqual(deleteResult);
    });
  });
  describe('checkIsUserVoteGuard', () => {
    it('있', async () => {
      const userVoteId = 1;
      const userId = 123;
      const expectedUserVote = { id: userVoteId, userId: userId };

      jest
        .spyOn(mockEachVoteRepository, 'findOne')
        .mockResolvedValue(expectedUserVote);

      const result = await service.checkIsUserVoteGuard(userVoteId, userId);

      expect(result).toEqual(expectedUserVote);
      expect(mockEachVoteRepository.findOne).toHaveBeenCalledWith({
        where: { id: userVoteId, userId: userId },
      });
    });

    it('없', async () => {
      const userVoteId = 1;
      const userId = 123;

      jest.spyOn(mockEachVoteRepository, 'findOne').mockResolvedValue(null);

      const result = await service.checkIsUserVoteGuard(userVoteId, userId);

      expect(result).toBeNull();
      expect(mockEachVoteRepository.findOne).toHaveBeenCalledWith({
        where: { id: userVoteId, userId: userId },
      });
    });
  });
  describe('getUserVoteCounts', () => {
    it('카운트', async () => {
      const polticalVoteId = 1;
      const expectedResult = {
        vote1Percentage: '60.00%',
        vote2Percentage: '40.00%',
        totalVotes: 10,
      };
      const result = {
        voteForTrue: '6',
        voteForFalse: '4',
      };

      mockDataSource.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(result),
      });

      const userVoteCounts = await service.getUserVoteCounts(polticalVoteId);

      expect(userVoteCounts).toEqual(expectedResult);
      expect(mockDataSource.getRepository).toHaveBeenCalledWith(
        EachPolticalVote,
      );
      expect(
        mockDataSource.getRepository().createQueryBuilder().select,
      ).toHaveBeenCalledWith(
        'SUM(CASE WHEN eachPolticalVote.voteFor = true THEN 1 ELSE 0 END)',
        'voteForTrue',
      );
      expect(
        mockDataSource.getRepository().createQueryBuilder().addSelect,
      ).toHaveBeenCalledWith(
        'SUM(CASE WHEN eachPolticalVote.voteFor = false THEN 1 ELSE 0 END)',
        'voteForFalse',
      );
      expect(
        mockDataSource.getRepository().createQueryBuilder().where,
      ).toHaveBeenCalledWith(
        'eachPolticalVote.polticalVoteId = :polticalVoteId',
        {
          polticalVoteId,
        },
      );
    });
  });
  describe('getVoteCounts', () => {
    it('카운트', async () => {
      const polticalVoteId = 1;
      const expectedResult = {
        vote1Percentage: '60.00%',
        vote2Percentage: '40.00%',
      };
      const result = {
        voteForTrue: '6',
        voteForFalse: '4',
      };

      mockDataSource.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(result),
      });

      const voteCounts = await service.getVoteCounts(polticalVoteId);

      expect(voteCounts).toEqual(expectedResult);
      expect(mockDataSource.getRepository).toHaveBeenCalledWith(
        EachPolticalVote,
      );
      expect(
        mockDataSource.getRepository().createQueryBuilder().select,
      ).toHaveBeenCalledWith(
        'SUM(CASE WHEN eachPolticalVote.voteFor = true THEN 1 ELSE 0 END)',
        'voteForTrue',
      );
      expect(
        mockDataSource.getRepository().createQueryBuilder().addSelect,
      ).toHaveBeenCalledWith(
        'SUM(CASE WHEN eachPolticalVote.voteFor = false THEN 1 ELSE 0 END)',
        'voteForFalse',
      );
      expect(
        mockDataSource.getRepository().createQueryBuilder().where,
      ).toHaveBeenCalledWith(
        'eachPolticalVote.polticalVoteId = :polticalVoteId',
        {
          polticalVoteId,
        },
      );
    });
  });
  describe('투표 업데이트', () => {
    it('업뎃', async () => {
      const polticalVoteId = 1;
      const result = {
        voteCount1: '6',
        voteCount2: '4',
      };

      mockDataSource.getRepository.mockReturnValueOnce({
        createQueryBuilder: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(result),
      });

      const mockUpdateQuery = jest.fn().mockReturnThis();
      const mockExecuteQuery = jest.fn().mockResolvedValue({ affected: 1 });
      mockDataSource.getRepository.mockReturnValueOnce({
        createQueryBuilder: jest.fn().mockReturnThis(),
        update: mockUpdateQuery,
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: mockExecuteQuery,
      });

      await service.updateVoteCounts(polticalVoteId);

      expect(mockDataSource.getRepository).toHaveBeenCalledWith(
        EachPolticalVote,
      );
      expect(
        mockDataSource.getRepository().createQueryBuilder().where,
      ).toHaveBeenCalledWith(
        'eachPolticalVote.polticalVoteId = :polticalVoteId',
        { polticalVoteId },
      );

      expect(mockExecuteQuery).toHaveBeenCalled();
    });
  });
  it('should add vote for user or non-user', async () => {
    const ip = '127.0.0.1';
    const userId = 1;
    const polticalVoteId = 1;
    const voteFor = true;

    const mockValidationAndSaveVote = jest.fn().mockResolvedValueOnce({});
    service.validationAndSaveVote = mockValidationAndSaveVote;

    const result = await service.addPolticalVoteUserorNanUser(
      ip,
      userId,
      polticalVoteId,
      voteFor,
    );

    expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
    expect(mockValidationAndSaveVote).toHaveBeenCalledWith(
      { userId, ip, polticalVoteId, voteFor },
      expect.any(Object),
    );
    expect(result).toEqual({ VoteOk: true });
  });
});
