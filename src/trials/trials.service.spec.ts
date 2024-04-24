import { Test, TestingModule } from '@nestjs/testing';
import { TrialsService } from './trials.service';
import { DataSource, Repository } from 'typeorm';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { title } from 'process';
import { Role } from '../users/types/userRole.type';
import { Users } from '../users/entities/user.entity';
import { UserInfos } from '../users/entities/user-info.entity';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { OnlineBoardComments } from '../online_board_comment/entities/online_board_comment.entity';
import { Trials } from './entities/trial.entity';
import { HumorBoards } from '../humors/entities/humor-board.entity';
import { HumorComments } from '../humor-comments/entities/humor_comment.entity';
import { PolticalDebateBoards } from '../poltical_debates/entities/poltical_debate.entity';
import { PolticalDebateComments } from '../poltical_debates/entities/poltical_debate_comments.entity';
import { EachPolticalVote } from '../poltical_debates/entities/userVoteOfPoltical_debate.entity';
import { EachHumorVote } from '../humors/entities/UservoteOfHumorVote.entity';
import { HumorLike } from '../humors/entities/humor_like.entity';
import { OnlineBoardLike } from '../online_boards/entities/online_board_like.entity';
import { EachVote } from './entities/Uservote.entity';
import { connect } from 'http2';
import { release } from 'os';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Votes } from './entities/vote.entity';
import { Readable } from 'stream';
import { S3Service } from '../s3/s3.service';
import { NotFoundException } from '@nestjs/common';

const mockedUser: Users = {
    id: 1,
    role: Role.User,
    createdAt: new Date(),
    updatedAt: new Date(),
    userInfo: new UserInfos(),
    onlineBoard: [new OnlineBoards()],
    onlineBoardComment: [new OnlineBoardComments()],
    trial: [new Trials()],
    humorBoard: [new HumorBoards()],
    humorComment: [new HumorComments()],
    polticalDebateBoards: [new PolticalDebateBoards()],
    polticalDebateComments: [new PolticalDebateComments()],
    humorLike: [],
    onlineBoardLike: [],
    eachVote: [],
    eachHumorVote: [],
    eachPolticalVote: [],
    trialsChat: [],
  };

const mockedTrial: Trials = {
  id: 1,
  userId: 1,
  title: 'Test Title',
  content: 'Test Content',
  view: 1,
  like: 1,
  top_comments: 'Test Top Comment',
  is_time_over: false,
  createdAt : new Date(),
  updatedAt : new Date(),
  deletedAt: new Date(),
  user: null,
  vote: null,
  trialLike: null,
}

const mockVote = {
    trialId: 1,
    title1: '할머니',
    title2: '은가누',
  } as Votes;

const mockFile: Express.Multer.File[] = [
    {
      fieldname: 'file',
      originalname: 'testfile.txt',
      encoding: '7bit',
      mimetype: 'text/plain',
      size: 128,
      destination: './upload',
      filename: 'testfile.txt',
      path: './upload/testfile.txt',
      buffer: Buffer.from('Hello World'),
      stream: Readable.from(Buffer.from('Hello World')),
    },
  ];
  
  describe('TrialsService', () => {
    let service: TrialsService;
    let mockTrialsRepository: Partial<Record<keyof Repository<Trials>, jest.Mock>>;
  
    beforeEach(async () => {
      mockTrialsRepository = {
        findOneBy: jest.fn(),
      };
  
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TrialsService,
          {
            provide: getRepositoryToken(Trials),
            useValue: mockTrialsRepository,
          },
        ],
      }).compile();
  
      service = module.get<TrialsService>(TrialsService);
    });
  
    describe('findByUserTrials', () => {
      it('should return trials if they exist', async () => {
        const userId = 1;
        const expectedTrial = mockedTrial; // 예상되는 재판 정보를 여기에 넣으세요
        mockTrialsRepository.findOneBy.mockResolvedValue(expectedTrial);
  
        const result = await service.findByUserTrials(userId);
        expect(result).toEqual(expectedTrial);
        expect(mockTrialsRepository.findOneBy).toHaveBeenCalledWith({ userId });
      });
  
      it('should throw NotFoundException if no trials are found', async () => {
        const userId = 1;
        mockTrialsRepository.findOneBy.mockResolvedValue(null);
  
        await expect(service.findByUserTrials(userId)).rejects.toThrow(NotFoundException);
      });
    });
  });