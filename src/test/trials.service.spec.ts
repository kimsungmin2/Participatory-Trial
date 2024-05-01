import { Test, TestingModule } from '@nestjs/testing';
import { TrialsService } from '../trials/trials.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Queue } from 'bull';
import { UsersService } from '../users/users.service';
import { Votes } from '../trials/entities/vote.entity';
import { Trials } from '../trials/entities/trial.entity';
import { TrialHallOfFames } from '../trials/entities/trial_hall_of_fame.entity';
import { PanryeInfo } from '../trials/entities/panryedata.entity';
import { HttpService } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import {
  ForbiddenException,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { Users } from '../users/entities/user.entity';
import { TrialLike } from '../trials/entities/trials.like.entity';
import { EachVote } from '../trials/entities/Uservote.entity';

describe('TrialsService', () => {
  let service: TrialsService;
  let trialsRepository: Repository<Trials>;
  let votesRepository: Repository<Votes>;
  let dataSource: DataSource;
  let queue: Queue;
  let queryRunner: any;

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockTrialsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockVotesRepository = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const mockRepository = () => ({
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    });
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockDataSource = {
      createQueryRunner: jest.fn(() => queryRunner),
    };

    const mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
    };

    const mockQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      //   imports: [
      //     BullModule.registerQueue({
      //       name: 'trial-queue',
      //     }),
      //   ],
      providers: [
        TrialsService,
        { provide: getRepositoryToken(Trials), useValue: mockTrialsRepository },
        { provide: getRepositoryToken(Votes), useValue: mockVotesRepository },
        { provide: getRepositoryToken(PanryeInfo), useFactory: mockRepository },
        {
          provide: getRepositoryToken(TrialHallOfFames),
          useFactory: mockRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
        // { provide: 'trial-queue', useValue: mockQueue },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<TrialsService>(TrialsService);
    trialsRepository = module.get(getRepositoryToken(Trials));
    votesRepository = module.get(getRepositoryToken(Votes));
    dataSource = module.get(DataSource);
    // queue = module.get('trial-queue', { strict: false });
    queryRunner = dataSource.createQueryRunner();
  });

  describe('재판생성', () => {
    it('성공', async () => {
      const userId = 1;
      const createTrialDto = {
        title: 'Test Trial',
        content: 'Test Content',
        trialTime: new Date(),
      };
      const voteTitleDto = { title1: 'Option 1', title2: 'Option 2' };

      queryRunner.manager.create.mockImplementation((entity, data) => data);
      queryRunner.manager.save.mockImplementation((entity, data) =>
        Promise.resolve({ ...data, id: 123 }),
      );

      const result = await service.createTrial(
        userId,
        createTrialDto,
        voteTitleDto,
      );

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.create).toHaveBeenCalledTimes(2);
      expect(queryRunner.manager.save).toHaveBeenCalledTimes(2);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(result.savedTrial).toEqual(
        expect.objectContaining({
          title: createTrialDto.title,
          content: createTrialDto.content,
          userId: userId,
          is_time_over: false,
          trialTime: createTrialDto.trialTime,
        }),
      );
      expect(result.savedVote).toEqual(
        expect.objectContaining({
          title1: voteTitleDto.title1,
          title2: voteTitleDto.title2,
          trialId: 123,
        }),
      );
    });

    it('실패', async () => {
      const userId = 1;
      const createTrialDto = {
        title: 'Test Trial',
        content: 'Test Content',
        trialTime: new Date(),
      };
      const voteTitleDto = { title1: 'Option 1', title2: 'Option 2' };

      queryRunner.manager.save.mockRejectedValue(new Error('Failed to save'));

      await expect(
        service.createTrial(userId, createTrialDto, voteTitleDto),
      ).rejects.toThrow(InternalServerErrorException);

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
  describe('조회', () => {
    it('성공', async () => {
      const userId = 1;
      const expectedTrial = {
        id: 1,
        title: 'Test Trial',
        content: 'Test content',
        userId,
      };

      mockTrialsRepository.findOneBy.mockResolvedValue(expectedTrial);

      const result = await service.findByUserTrials(userId);
      expect(trialsRepository.findOneBy).toHaveBeenCalledWith({ userId });
      expect(result).toEqual(expectedTrial);
    });

    it('없음', async () => {
      const userId = 2;
      mockTrialsRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findByUserTrials(userId)).rejects.toThrow(
        new NotFoundException('해당 유저의 재판이 없습니다.'),
      );

      expect(trialsRepository.findOneBy).toHaveBeenCalledWith({ userId });
    });
  });
  describe('모든 재판 조회', () => {
    it('성공', async () => {
      const mockPaginationQueryDto = { page: 1, limit: 10 };
      const trials = [
        {
          id: 1,
          userId: 1,
          title: 'Trial 1',
          content: 'Content 1',
          created_at: new Date(),
        },
        {
          id: 2,
          userId: 2,
          title: 'Trial 2',
          content: 'Content 2',
          created_at: new Date(),
        },
      ];
      const users = [
        { id: 1, nickName: 'User1' },
        { id: 2, nickName: 'User2' },
      ];

      mockTrialsRepository.count.mockResolvedValue(2);
      mockTrialsRepository.find.mockResolvedValue(trials);
      mockUsersService.findById.mockImplementation((id) =>
        Promise.resolve(users.find((user) => user.id === id)),
      );

      const result = await service.findAllTrials(mockPaginationQueryDto);

      expect(trialsRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual({
        allTrials: [
          { ...trials[0], userName: users[0].nickName },
          { ...trials[1], userName: users[1].nickName },
        ],
        totalItems: 2,
      });
    });

    it('실패', async () => {
      const mockPaginationQueryDto = { page: 1, limit: 10 };
      mockTrialsRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(
        service.findAllTrials(mockPaginationQueryDto),
      ).rejects.toThrow(InternalServerErrorException);

      expect(trialsRepository.find).toHaveBeenCalled();
    });
  });
  describe('특정 재판 조회', () => {
    it('성공', async () => {
      const trialId = 1;
      const trialData = {
        id: trialId,
        title: 'Test Trial',
        content: 'Content Here',
      };
      const voteData = {
        trialId: trialId,
        title1: 'Option A',
        title2: 'Option B',
      };

      mockTrialsRepository.findOneBy.mockResolvedValue(trialData);
      mockVotesRepository.findOneBy.mockResolvedValue(voteData);

      const result = await service.findOneByTrialsId(trialId);

      expect(mockTrialsRepository.findOneBy).toHaveBeenCalledWith({
        id: trialId,
      });
      expect(mockVotesRepository.findOneBy).toHaveBeenCalledWith({
        trialId: trialId,
      });
      expect(result).toEqual({ OneTrials: trialData, vote: voteData });
    });

    it('실패', async () => {
      const trialId = 99;
      mockTrialsRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOneByTrialsId(trialId)).rejects.toThrow(
        new NotFoundException('검색한 재판이 없습니다.'),
      );

      expect(mockTrialsRepository.findOneBy).toHaveBeenCalledWith({
        id: trialId,
      });
    });
  });
  describe('updateTrials', () => {
    const mockOneTrials = {
      id: 1,
      userId: 6,
      title: '1231',
      content: '23',
      view: 0,
      like: 1,
      trialTime: new Date(),
      top_comments: null,
      is_time_over: true,
      created_at: new Date(),
      updated_at: new Date(),
      deletedAt: null,
      user: new Users(),
      votes: new Votes(),
      trialLike: new TrialLike(),
    };
    const mockVote = {
      id: 1,
      trialId: 1,
      title1: 'title1',
      title2: 'title2',
      voteCount1: 0,
      voteCount2: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      eachVote: [new EachVote()],
      trial: new Trials(),
    };
    it('should update the trial successfully', async () => {
      const userId = 1;
      const trialsId = 1;
      const updateTrialDto = {
        title: 'Updated Title',
        content: 'Updated Content',
      };

      jest
        .spyOn(service, 'findOneByTrialsId')
        .mockResolvedValue({ OneTrials: mockOneTrials, vote: mockVote });

      await service.updateTrials(userId, trialsId, updateTrialDto);

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      //   expect(queryRunner.manager.save).toHaveBeenCalledWith(Trials, {
      //     ...mockOneTrials,
      //     ...updateTrialDto,
      //   });
      //   expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
  describe('삭제', () => {
    const mockOneTrials = {
      id: 1,
      userId: 1,
      title: '1231',
      content: '23',
      view: 0,
      like: 1,
      trialTime: new Date(),
      top_comments: null,
      is_time_over: true,
      created_at: new Date(),
      updated_at: new Date(),
      deletedAt: null,
      user: new Users(),
      votes: new Votes(),
      trialLike: new TrialLike(),
    };
    const mockVote = {
      id: 1,
      trialId: 1,
      title1: 'title1',
      title2: 'title2',
      voteCount1: 0,
      voteCount2: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      eachVote: [new EachVote()],
      trial: new Trials(),
    };
    it('유저가 자신의 재판을 정상적으로 삭제할 수 있어야 합니다.', async () => {
      const id = 1;
      const user = { id: 1 };

      jest
        .spyOn(service, 'findOneByTrialsId')
        .mockResolvedValue({ OneTrials: mockOneTrials, vote: mockVote });

      await service.deleteTrials(id, user);

      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('권한이 없는 유저가 재판 삭제를 시도할 때 ForbiddenException을 발생시켜야 합니다.', async () => {
      const id = 1;
      const user = { id: 2 };

      jest
        .spyOn(service, 'findOneByTrialsId')
        .mockResolvedValue({ OneTrials: mockOneTrials, vote: mockVote });

      await expect(service.deleteTrials(id, user)).rejects.toThrow(
        ForbiddenException,
      );

      expect(queryRunner.startTransaction).toHaveBeenCalled();
    });
  });
  describe('createSubject', () => {
    it('성공', async () => {
      const trialId = 1;
      const voteDto = { title1: 'Option 1', title2: 'Option 2' };

      const expectedVote = {
        title1: voteDto.title1,
        title2: voteDto.title2,
        trialId,
      };

      queryRunner.manager.create.mockImplementation((entity, data) => data);
      queryRunner.manager.save.mockResolvedValue(expectedVote);

      const result = await service.createSubject(trialId, voteDto);

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.create).toHaveBeenCalledWith(
        Votes,
        expectedVote,
      );
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Votes,
        expectedVote,
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(result).toEqual(expectedVote);
    });

    it('롤백 ', async () => {
      const trialId = 1;
      const voteDto = { title1: 'Option 1', title2: 'Option 2' };

      queryRunner.manager.save.mockRejectedValue(new Error('Save failed'));

      await expect(service.createSubject(trialId, voteDto)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
  describe('updateSubject', () => {
    it('성공', async () => {
      const voteId = 1;
      const updateVoteDto = {
        title1: 'Updated Option 1',
        title2: 'Updated Option 2',
      };
      const existingVote = {
        id: voteId,
        title1: 'Option 1',
        title2: 'Option 2',
      };

      queryRunner.manager.findOne.mockResolvedValue(existingVote);
      queryRunner.manager.save.mockResolvedValue({
        ...existingVote,
        ...updateVoteDto,
      });

      const result = await service.updateSubject(voteId, updateVoteDto);

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Votes, {
        where: { id: voteId },
      });
      expect(queryRunner.manager.save).toHaveBeenCalledWith(Votes, {
        ...existingVote,
        ...updateVoteDto,
      });
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(result).toEqual({ ...existingVote, ...updateVoteDto });
    });

    it('실패', async () => {
      const voteId = 1;
      const updateVoteDto = {
        title1: 'Updated Option 1',
        title2: 'Updated Option 2',
      };
      queryRunner.manager.findOne.mockResolvedValue(null);

      await expect(
        service.updateSubject(voteId, updateVoteDto),
      ).rejects.toThrow(InternalServerErrorException);

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Votes, {
        where: { id: voteId },
      });
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
  describe('deleteVote', () => {
    it('삭제', async () => {
      const voteId = 1;
      const deleteResult = { affected: 1 };
      queryRunner.manager.delete.mockResolvedValue(deleteResult);

      await service.deleteVote(voteId);

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.delete).toHaveBeenCalledWith(Votes, {
        id: voteId,
      });
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('삭제', async () => {
      const voteId = 99;
      const deleteResult = { affected: 0 };
      queryRunner.manager.delete.mockResolvedValue(deleteResult);

      await expect(service.deleteVote(voteId)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('실패', async () => {
      const voteId = 1;
      queryRunner.manager.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteVote(voteId)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
  describe('checkIsActiveGuard', () => {
    it('o', async () => {
      const trialId = 1;
      const mockTrial = {
        id: trialId,
        is_time_over: false,
      };

      mockTrialsRepository.findOne.mockResolvedValue(mockTrial);

      const result = await service.checkIsActiveGuard(trialId);
      expect(trialsRepository.findOne).toHaveBeenCalledWith({
        where: { id: trialId },
      });
      expect(result).toEqual(mockTrial);
    });

    it('에러', async () => {
      const trialId = 99;
      mockTrialsRepository.findOne.mockResolvedValue(null);

      await expect(service.checkIsActiveGuard(trialId)).rejects.toThrow(
        '타임 아웃된 투표입니다.',
      );
    });

    it('타임아웃', async () => {
      const trialId = 2;
      const mockTrial = {
        id: trialId,
        is_time_over: true,
      };

      mockTrialsRepository.findOne.mockResolvedValue(mockTrial);

      await expect(service.checkIsActiveGuard(trialId)).rejects.toThrow(
        '타임 아웃된 투표입니다.',
      );
    });
  });
  describe('checkPostOwner', () => {
    const mockFindOneByTrialsResponse = {
      OneTrials: {
        id: 1,
        userId: 6,
        title: '1231',
        content: '23',
        view: 0,
        like: 1,
        trialTime: new Date(),
        top_comments: null,
        is_time_over: true,
        created_at: new Date(),
        updated_at: new Date(),
        deletedAt: null,
        user: new Users(),
        votes: new Votes(),
        trialLike: new TrialLike(),
      },
      vote: {
        id: 1,
        trialId: 1,
        title1: 'title1',
        title2: 'title2',
        voteCount1: 0,
        voteCount2: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        eachVote: [new EachVote()],
        trial: new Trials(),
      },
    };
    it('should allow access if the user is the owner of the trial', async () => {
      const trialId = 1;
      const user = { id: 6 } as Users;

      jest
        .spyOn(service, 'findOneByTrialsId')
        .mockResolvedValue(mockFindOneByTrialsResponse);

      const result = await service.checkPostOwner(trialId, user);
      expect(service.findOneByTrialsId).toHaveBeenCalledWith(trialId);
      expect(result).toEqual(mockFindOneByTrialsResponse);
    });

    it('should throw ForbiddenException if the user is not the owner', async () => {
      const trialId = 1;
      const user = { id: 2 } as Users;

      jest
        .spyOn(service, 'findOneByTrialsId')
        .mockResolvedValue(mockFindOneByTrialsResponse);

      await expect(service.checkPostOwner(trialId, user)).rejects.toThrow(
        new ForbiddenException('권한이 없습니다.'),
      );

      expect(service.findOneByTrialsId).toHaveBeenCalledWith(trialId);
    });
  });
});
