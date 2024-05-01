import { Test } from '@nestjs/testing';
import { EventsGateway } from '../events/events.gateway';
import { ChatsService } from '../chats/chats.service';
import { VotesService } from '../trials/vote/vote.service';
import { CustomSocket } from '../utils/interface/socket.interface';
import { ConfigModule } from '@nestjs/config';
import { Redis } from 'ioredis';
import { HumorVotesService } from '../humors_votes/humors_votes.service';
import { PolticalVotesService } from '../poltical_debates_vote/poltical_debates_vote.service';
import { LikeService } from '../like/like.service';

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let chatsService: ChatsService;
  let votesService: VotesService;
  let humorVotesService: HumorVotesService;
  let polticalVotesService: PolticalVotesService;
  let mockSocket: CustomSocket;
  let mockRedisSubClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    mockRedisSubClient = {
      subscribe: jest.fn().mockResolvedValue('OK'),
      on: jest.fn(),
    } as any;
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [
        EventsGateway,
        {
          provide: ChatsService,
          useValue: {
            createChannelChat: jest.fn().mockResolvedValue(undefined),
            getChannel: jest.fn().mockResolvedValue([]),
            publishNotification: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: VotesService,
          useValue: {
            addVoteUserorNanUser: jest.fn().mockResolvedValue(undefined),
            getUserVoteCounts: jest.fn().mockResolvedValue({
              vote1Percentage: '50%',
              vote2Percentage: '50%',
            }),
          },
        },
        {
          provide: HumorVotesService,
          useValue: {
            addHumorVoteUserorNanUser: jest.fn().mockResolvedValue(undefined),
            getUserVoteCounts: jest.fn().mockResolvedValue({
              vote1Percentage: '50%',
              vote2Percentage: '50%',
            }),
          },
        },
        {
          provide: PolticalVotesService,
          useValue: {
            addPolticalVoteUserorNanUser: jest
              .fn()
              .mockResolvedValue(undefined),
            getUserVoteCounts: jest.fn().mockResolvedValue({
              vote1Percentage: '50%',
              vote2Percentage: '50%',
            }),
          },
        },
        {
          provide: 'REDIS_SUB_CLIENT',
          useValue: mockRedisSubClient,
        },
        {
          provide: LikeService,
          useValue: {},
        },
      ],
    }).compile();

    gateway = moduleRef.get<EventsGateway>(EventsGateway);
    chatsService = moduleRef.get<ChatsService>(ChatsService);
    votesService = moduleRef.get<VotesService>(VotesService);
    humorVotesService = moduleRef.get<HumorVotesService>(HumorVotesService);
    polticalVotesService =
      moduleRef.get<PolticalVotesService>(PolticalVotesService);
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;
    mockSocket = {
      id: 'socketId',
      userId: 1,
      emit: jest.fn(),
      join: jest.fn(),
      request: {
        headers: {
          'x-forwarded-for': ['127.0.0.1'],
        },
      },
    } as any;

    gateway['redisSubClient'] = mockRedisSubClient;
  });

  it('should handle notification messages for notifications channel', () => {
    // 테스트 데이터 설정
    const channel = 'notifications';
    const message = 'Test notification message';

    // 모의 함수 설정
    const emitMock = jest.spyOn(gateway.server, 'emit');

    // 테스트 실행
    gateway.handleNotificationMessage(channel, message);

    // 기대값 검증
    expect(emitMock).toHaveBeenCalledWith('notification', message);
  });

  it('should not handle notification messages for other channels', () => {
    // 테스트 데이터 설정
    const channel = 'other-channel';
    const message = 'Test notification message';

    // 모의 함수 설정
    const emitMock = jest.spyOn(gateway.server, 'emit');

    // 테스트 실행
    gateway.handleNotificationMessage(channel, message);

    // 기대값 검증
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('조인', async () => {
    const testData = { roomId: 1, channelType: 'testType' };

    await gateway.handleJoinMessage(testData, mockSocket);

    expect(mockSocket.join).toHaveBeenCalledWith(
      `${testData.channelType}:${testData.roomId}`,
    );
  });

  describe('메시지 생성', () => {
    it('메시지 성공적으로 생성', async () => {
      const testData = {
        channelType: 'testType',
        message: 'testMessage',
        roomId: 1,
      };

      jest
        .spyOn(chatsService, 'createChannelChat')
        .mockResolvedValue('testUser');

      await gateway.handleCreateChat(testData, mockSocket);

      // 함수 호출 검증
      expect(chatsService.createChannelChat).toHaveBeenCalledWith(
        testData.channelType,
        mockSocket.userId,
        testData.message,
        testData.roomId,
        '127.0.0.1',
      );

      // 서버 메시지 전송 검증
      expect(gateway.server.to).toHaveBeenCalledWith(
        `${testData.channelType}:${testData.roomId}`,
      );
      expect(gateway.server.emit).toHaveBeenCalledWith('message', {
        userId: mockSocket.userId,
        message: testData.message,
        userName: 'testUser',
      });
    });

    it('생성 실패', async () => {
      const testData = {
        channelType: 'testType',
        userId: 1,
        message: 'testMessage',
        roomId: 1,
      };
      mockSocket.userId = testData.userId;

      jest
        .spyOn(chatsService, 'createChannelChat')
        .mockRejectedValue(new Error('Chat creation error'));

      console.error = jest.fn();
      mockSocket.emit = jest.fn();

      await gateway.handleCreateChat(testData, mockSocket as any);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error',
        '채팅 생성에 실패하였습니다.',
      );
    });
  });

  describe('투표', () => {
    it('정치', async () => {
      const testData = {
        channelType: 'trials',
        roomId: 1,
        voteFor: true,
      };

      jest
        .spyOn(votesService, 'addVoteUserorNanUser')
        .mockResolvedValue(undefined);
      jest.spyOn(votesService, 'getUserVoteCounts').mockResolvedValue({
        vote1Percentage: '60%',
        vote2Percentage: '40%',
        totalVotes: 100, // 이 필드를 포함하여 모의 반환값을 설정
      });

      await gateway.handleCreateVote(testData, mockSocket);

      expect(votesService.addVoteUserorNanUser).toHaveBeenCalledWith(
        '127.0.0.1',
        mockSocket.userId,
        testData.roomId,
        testData.voteFor,
      );
      expect(votesService.getUserVoteCounts).toHaveBeenCalledWith(
        testData.roomId,
      );
      expect(gateway.server.to).toHaveBeenCalledWith('trials:1');
      expect(gateway.server.emit).toHaveBeenCalledWith('vote', {
        userId: mockSocket.userId,
        votes: {
          vote1Percentage: '60%',
          vote2Percentage: '40%',
          totalVotes: 100,
        },
      });
    });

    it('정치', async () => {
      const testData = {
        channelType: 'humors',
        roomId: 1,
        voteFor: true,
      };

      jest
        .spyOn(votesService, 'addVoteUserorNanUser')
        .mockResolvedValue(undefined);
      jest.spyOn(humorVotesService, 'getUserVoteCounts').mockResolvedValue({
        vote1Percentage: '60%',
        vote2Percentage: '40%',
        totalVotes: 100, // 이 필드를 포함하여 모의 반환값을 설정
      });

      await gateway.handleCreateVote(testData, mockSocket);

      expect(humorVotesService.addHumorVoteUserorNanUser).toHaveBeenCalledWith(
        '127.0.0.1',
        mockSocket.userId,
        testData.roomId,
        testData.voteFor,
      );
      expect(humorVotesService.getUserVoteCounts).toHaveBeenCalledWith(
        testData.roomId,
      );
      expect(gateway.server.to).toHaveBeenCalledWith('humors:1');
      expect(gateway.server.emit).toHaveBeenCalledWith('vote', {
        userId: mockSocket.userId,
        votes: {
          vote1Percentage: '60%',
          vote2Percentage: '40%',
          totalVotes: 100,
        },
      });
    });

    it('정치', async () => {
      const testData = {
        channelType: 'poltical-debates',
        roomId: 1,
        voteFor: true,
      };

      jest
        .spyOn(polticalVotesService, 'addPolticalVoteUserorNanUser')
        .mockResolvedValue(undefined);
      jest.spyOn(polticalVotesService, 'getUserVoteCounts').mockResolvedValue({
        vote1Percentage: '60%',
        vote2Percentage: '40%',
        totalVotes: 100, // 모의 데이터 설정
      });

      await gateway.handleCreateVote(testData, mockSocket);

      expect(
        polticalVotesService.addPolticalVoteUserorNanUser,
      ).toHaveBeenCalledWith(
        '127.0.0.1',
        mockSocket.userId,
        testData.roomId,
        testData.voteFor,
      );
      expect(polticalVotesService.getUserVoteCounts).toHaveBeenCalledWith(
        testData.roomId,
      );
      expect(gateway.server.to).toHaveBeenCalledWith('poltical-debates:1');
      expect(gateway.server.emit).toHaveBeenCalledWith('vote', {
        userId: mockSocket.userId,
        votes: {
          totalVotes: 100,
          vote1Percentage: '60%',
          vote2Percentage: '40%',
          // totalVotes 필드 제외하고 테스트 예상치 수정
        },
      });
    });

    describe('handleCreateVote failures', () => {
      const testData = {
        channelType: 'trials',
        roomId: 1,
        voteFor: true,
      };
      const mockSocket = {
        id: 'socketId',
        userId: 1,
        emit: jest.fn(),
      } as unknown as CustomSocket;

      it('should handle errors during vote creation for trials', async () => {
        jest
          .spyOn(votesService, 'addVoteUserorNanUser')
          .mockRejectedValue(new Error('Failed to add vote'));

        await gateway.handleCreateVote(testData, mockSocket);

        expect(mockSocket.emit).toHaveBeenCalledWith(
          'error',
          '투표 생성에 실패하였습니다.',
        );
      });

      it('should handle errors during vote creation for humors', async () => {
        testData.channelType = 'humors';
        jest
          .spyOn(humorVotesService, 'addHumorVoteUserorNanUser')
          .mockRejectedValue(new Error('Failed to add humor vote'));

        await gateway.handleCreateVote(testData, mockSocket);

        expect(mockSocket.emit).toHaveBeenCalledWith(
          'error',
          '투표 생성에 실패하였습니다.',
        );
      });

      it('should handle errors during vote creation for poltical-debates', async () => {
        testData.channelType = 'poltical-debates';
        jest
          .spyOn(polticalVotesService, 'addPolticalVoteUserorNanUser')
          .mockRejectedValue(new Error('Failed to add political vote'));

        await gateway.handleCreateVote(testData, mockSocket);

        expect(mockSocket.emit).toHaveBeenCalledWith(
          'error',
          '투표 생성에 실패하였습니다.',
        );
      });
    });
  });

  describe('커넥션', () => {
    it('성공', () => {
      console.log = jest.fn();

      const mockSocket = {
        id: 'socketId123',
        request: {
          headers: {
            cookie: 'userSession=abcd1234',
          },
        },
        emit: jest.fn(),
      };

      gateway.handleConnection(mockSocket as unknown as CustomSocket);
    });
  });

  describe('디스커넥트', () => {
    it('성공적으로 끊김', () => {
      console.log = jest.fn();

      gateway.handleDisconnect(mockSocket as unknown as CustomSocket);
    });
  });
  it('알림', () => {
    const testMessage = 'Test notification message';

    gateway.sendNotification(testMessage);

    expect(gateway.server.emit).toHaveBeenCalledWith(
      'notification',
      testMessage,
    );
  });
  it('should handle trials channel requests correctly', async () => {
    const testData = { channelTypes: 'trials', roomId: 1, page: 1 };
    const mockChats = [
      {
        id: 1,
        message: 'Hello',
        timestamp: new Date(),
        userId: 123,
        RoomId: 456,
        userName: '모진영군',
      },
    ];

    const mockVotes = {
      totalVotes: 10,
      vote1Percentage: '50%',
      vote2Percentage: '50%',
    };

    jest.spyOn(chatsService, 'getChannel').mockResolvedValue(mockChats);
    jest.spyOn(votesService, 'getUserVoteCounts').mockResolvedValue(mockVotes);

    await gateway.handleRequestChannel(testData, mockSocket);

    expect(chatsService.getChannel).toHaveBeenCalledWith('trials', 1, 1);
    expect(votesService.getUserVoteCounts).toHaveBeenCalledWith(1);
    expect(mockSocket.emit).toHaveBeenCalledWith('channelsResponse', {
      chats: mockChats,
      votes: mockVotes,
    });
  });

  it('should handle humor channel requests correctly', async () => {
    const testData = { channelTypes: 'humors', roomId: 1, page: 1 };
    const mockVotes = {
      totalVotes: 5,
      vote1Percentage: '50%',
      vote2Percentage: '50%',
    };

    jest
      .spyOn(humorVotesService, 'getUserVoteCounts')
      .mockResolvedValue(mockVotes);

    await gateway.handleRequestChannel(testData, mockSocket);

    expect(humorVotesService.getUserVoteCounts).toHaveBeenCalledWith(1);
    expect(mockSocket.emit).toHaveBeenCalledWith('votesResponse', mockVotes);
  });
  it('should handle humor channel requests correctly', async () => {
    const testData = { channelTypes: 'poltical-debates', roomId: 1, page: 1 };
    const mockVotes = {
      totalVotes: 5,
      vote1Percentage: '50%',
      vote2Percentage: '50%',
    };

    jest
      .spyOn(polticalVotesService, 'getUserVoteCounts')
      .mockResolvedValue(mockVotes);

    await gateway.handleRequestChannel(testData, mockSocket);

    expect(polticalVotesService.getUserVoteCounts).toHaveBeenCalledWith(1);
    expect(mockSocket.emit).toHaveBeenCalledWith('votesResponse', mockVotes);
  });

  it('should handle errors correctly', async () => {
    const testData = { channelTypes: 'trials', roomId: 1, page: 1 };
    const error = new Error('Error fetching data');

    jest.spyOn(chatsService, 'getChannel').mockRejectedValue(error);

    await gateway.handleRequestChannel(testData, mockSocket);

    expect(console.error).toHaveBeenCalledWith(
      '채팅 메시지 조회 과정에서 오류가 발생했습니다:',
      error,
    );
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'error',
      '채팅 메시지 조회에 실패하였습니다.',
    );
  });
});
