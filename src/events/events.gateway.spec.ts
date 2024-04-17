import { Test } from '@nestjs/testing';
import { EventsGateway } from './events.gateway';
import { ChatsService } from '../chats/chats.service';
import { VotesService } from '../trials/vote/vote.service';
import { Socket } from 'socket.io';
import { CustomSocket } from '../utils/interface/socket.interface';
import { Chat } from './entities/chat.entity';
import { ConfigModule } from '@nestjs/config';
import { Redis } from 'ioredis';
import { PolticalVotesService } from '../poltical_debates/poltical_debates_vote/poltical_debates_vote.service';
import { HumorVotesService } from '../humors/humors_votes/humors_votes.service';

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
            addVoteUserorNanUser: jest.fn().mockResolvedValue(undefined),
            getUserVoteCounts: jest.fn().mockResolvedValue({
              vote1Percentage: '50%',
              vote2Percentage: '50%',
            }),
          },
        },
        {
          provide: PolticalVotesService,
          useValue: {
            addVoteUserorNanUser: jest.fn().mockResolvedValue(undefined),
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
      emit: jest.fn(),
      join: jest.fn(),
      userId: 1,
      broadcast: {
        to: jest.fn(() => ({
          emit: jest.fn(),
        })),
      },
    } as any;

    gateway['redisSubClient'] = mockRedisSubClient;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('알림을 위한 서버 구독', async () => {
    await gateway.onModuleInit();

    expect(mockRedisSubClient.subscribe).toHaveBeenCalledWith('notifications');
    expect(mockRedisSubClient.on).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );

    const messageHandler = mockRedisSubClient.on.mock.calls.find(
      (call) => call[0] === 'message',
    )[1];
    const testMessage = 'Test notification message';
    const testChannel = 'notifications';

    messageHandler(testChannel, testMessage);

    expect(gateway.server.emit).toHaveBeenCalledWith(
      'notification',
      testMessage,
    );
  });

  it('조인', async () => {
    const testData = { roomId: 1, channelType: 'testType' };

    await gateway.handleJoinMessage(testData, mockSocket as any);

    expect(mockSocket.join).toHaveBeenCalledWith(
      `${testData.channelType}:${testData.roomId}`,
    );
  });

  describe('메시지 생성', () => {
    it('메시지 성공적으로 생성', async () => {
      const testData = {
        channelType: 'testType',
        userId: 1,
        message: 'testMessage',
        roomId: 1,
      };
      mockSocket.userId = testData.userId;

      jest
        .spyOn(chatsService, 'createChannelChat')
        .mockResolvedValue(undefined);

      await gateway.handleCreateChat(testData, mockSocket as any);

      expect(chatsService.createChannelChat).toHaveBeenCalledWith(
        testData.channelType,
        testData.userId,
        testData.message,
        testData.roomId,
      );

      expect(gateway.server.to).toHaveBeenCalledWith(
        `${testData.channelType}:${testData.roomId}`,
      );
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
    it('투표 성공적으로 ', async () => {
      const testData = {
        channelType: 'testType',
        userCode: 'socketId',
        roomId: 1,
        voteFor: true,
      };
      const userId = 1;
      mockSocket.userId = userId;
      const vote1Percentage = '50%';
      const vote2Percentage = '50%';
      const totalVotes = 5;

      const testVotes = {
        vote1Percentage,
        vote2Percentage,
        totalVotes,
      };
      jest
        .spyOn(votesService, 'addVoteUserorNanUser')
        .mockResolvedValue(undefined);
      jest
        .spyOn(votesService, 'getUserVoteCounts')
        .mockResolvedValue(testVotes);

      await gateway.handleCreateVote(testData, mockSocket as any);

      expect(votesService.addVoteUserorNanUser).toHaveBeenCalledWith(
        testData.userCode,
        userId,
        testData.roomId,
        testData.voteFor,
      );
      expect(votesService.getUserVoteCounts).toHaveBeenCalledWith(
        testData.roomId,
      );
      expect(gateway.server.to).toHaveBeenCalledWith(
        `${testData.channelType}:${testData.roomId}`,
      );
    });
    it('투표 실패', async () => {
      const testData = {
        channelType: 'testType',
        roomId: 1,
        voteFor: true,
      };
      const userId = 1;
      mockSocket.userId = userId;

      jest
        .spyOn(votesService, 'addVoteUserorNanUser')
        .mockRejectedValue(new Error('Vote creation error'));

      console.error = jest.fn();
      mockSocket.emit = jest.fn();

      await gateway.handleCreateVote(testData, mockSocket as any);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('투표 생성 과정에서 오류가 발생했습니다:'),
        expect.any(Error),
      );

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error',
        '투표 생성에 실패하였습니다.',
      );
    });
  });

  describe('채팅내역', () => {
    it('채팅 내역', async () => {
      const testData = {
        channelTypes: 'testType',
        roomId: 1,
        page: 1,
      };

      const testChats: Chat[] = [
        {
          id: 1,
          message: 'testMessage',
          timestamp: new Date(),
          userId: 1,
          RoomId: testData.roomId,
          userName: 'gg',
        },
      ];

      const vote1Percentage = '50%';
      const vote2Percentage = '50%';
      const totalVotes = 5;

      const testVotes = {
        vote1Percentage,
        vote2Percentage,
        totalVotes,
      };

      jest.spyOn(chatsService, 'getChannel').mockResolvedValue(testChats);
      jest
        .spyOn(votesService, 'getUserVoteCounts')
        .mockResolvedValue(testVotes);

      await gateway.handleRequestChannel(testData, mockSocket as any);

      expect(chatsService.getChannel).toHaveBeenCalledWith(
        testData.channelTypes,
        testData.roomId,
        testData.page,
      );
      expect(votesService.getUserVoteCounts).toHaveBeenCalledWith(
        testData.roomId,
      );
      expect(mockSocket.emit).toHaveBeenCalledWith('channelsResponse', {
        chats: testChats,
        votes: testVotes,
      });
    });
    it('불러오기 실패', async () => {
      const testData = {
        channelTypes: 'testType',
        roomId: 1,
        page: 1,
      };

      jest
        .spyOn(chatsService, 'getChannel')
        .mockRejectedValue(new Error('Fetch error'));

      console.error = jest.fn();
      mockSocket.emit = jest.fn();

      await gateway.handleRequestChannel(testData, mockSocket as any);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(
          '채팅 메시지 조회 과정에서 오류가 발생했습니다:',
        ),
        expect.any(Error),
      );

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error',
        '채팅 메시지 조회에 실패하였습니다.',
      );
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
});
