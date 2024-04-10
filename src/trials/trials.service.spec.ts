import { Test, TestingModule } from '@nestjs/testing';
import { TrialsService } from './trials.service';
import { DataSource } from 'typeorm';
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


jest.mock('trial-queue', () => {
  return {
    __esModule: true,
    TrialsService: jest.fn().mockImplementation(() => ({
      trailQueue: {
        add: jest.fn().mockRejectedValue(true),
      }
    }))
  }
})
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
  eachPolticalVote: [new EachPolticalVote()],
  eachHumorVote: [new EachHumorVote()],
  humorLike: [new HumorLike()],
  onlineBoardLike: [new OnlineBoardLike()],
  eachVote: [new EachVote()],
};

const mockedTrial: Trials = {
  id: 1,
  content: 'Test Content',
  userId: 1,
  title: 'Test Title',
  view: 1,
  like: 1,
  top_comments: 'Test Top Comment',
  is_time_over: false,
  createdAt : new Date(),
  updatedAt : new Date(),
  user: null,
  vote: null,
  trialLike: null,
}

describe('TrialsService', () => {
  let service: TrialsService;
  let dataSource: DataSource;
  let trialQueue: Queue;

  const userId = 1;
  const createTrialDto = {
      title: 'Test title',
      content: 'Test Content',
      trialTime: new Date(),
  };
  const voteTitleDto = {
    title1: 'Test title1',
    title2: 'Test title2',
  };

  const mockTrialRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
    find: jest.fn()
  }

  const mockPanryeRepository = {
    find: jest.fn()
  }


  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    },
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockDataSource = {
    mockQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  const mockUserRepository = {

  }

  
  const mockTrialsRepository = {

  }

  const mockUserInfosRepository = {

  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrialsService,
        {
          provide: getQueueToken('trial-queue'),
          useValue: {
            add: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Users),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Trials),
          useValue: mockTrialsRepository,
        },
        {
          provide: getRepositoryToken(UserInfos),
          useValue: mockUserInfosRepository,
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: () => ({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              manager: {
                create: jest.fn(),
                save: jest.fn(),
                delete: jest.fn(),
              },
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
            }),
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              from: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<TrialsService>(TrialsService);
    dataSource = module.get<DataSource>(DataSource);
    trialQueue = module.get<Queue>(getQueueToken('trial-queue'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('재판과 재판에 대한 투표가 성공적으로 생성되었습니다.', async () => {
    const userId = 1;
    const createTrialDto = {
      title: 'Test title',
      content: 'Test Content',
      trialTime: new Date(),
    };
    const voteTitleDto = {
      title1: 'Test title1',
      title2: 'Test title2',
    };

    const mockTrial = {
      id: 1,
      ...createTrialDto,
      userId,
    };
    const mockVote = {
      id: 1,
      ...voteTitleDto,
      trialId: 1,
    };

    // Mock 설정을 테스트 내부에서 진행합니다.
    const mockSave = dataSource.createQueryRunner().manager.save as jest.Mock
    mockSave.mockResolvedValueOnce(mockTrial).mockResolvedValueOnce(mockVote);

    const result = await service.createTrial(userId, createTrialDto, voteTitleDto);
    expect(result).toEqual({ savedTrial: mockTrial, savedVote: mockVote });
    expect(trialQueue.add).toHaveBeenCalledWith(
      'updateTimeDone',
      {
        trialId: mockTrial.id,
      },
      expect.any(Object),
    );
  });

  it('생성이 실패 하였습니다.', async () => {
    // 에러
    const mockError = dataSource.createQueryRunner().manager.save as jest.Mock
    mockError.mockRejectedValue(new Error('Mock Error'))

    const userId = 1;
    const createTrialDto = {
      title: 'Test title',
      content: 'Test Content',
      trialTime: new Date()
    }
    const voteTitleDto = { 
      title1: 'Test Title1',
      title2: 'Test Title2',
    }

    await expect(service.createTrial(userId, createTrialDto, voteTitleDto)).rejects.toThrow('재판과 주표 생성 중 오류가 발생했습니다.');

    expect(dataSource.createQueryRunner().rollbackTransaction).toHaveBeenCalled();
  });
});
