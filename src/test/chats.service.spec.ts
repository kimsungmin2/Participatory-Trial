import { Test } from '@nestjs/testing';
import { ChatsService } from '../chats/chats.service';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { UserInfos } from '../users/entities/user-info.entity';
import { TrialsChat } from '../events/entities/trialsChat.entity';
import { HumorsChat } from '../events/entities/humorsChat.entity';
import { PolticalsChat } from '../events/entities/polticalsChat.entity';
import { ChannelType } from '../events/type/channeltype';
import { Chat } from '../schemas/chat.schemas';
import { getModelToken } from '@nestjs/mongoose';
import { NicknameGeneratorService } from '../chats/nickname.service';

const mockChatModel = {
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
};

describe('ChatsService', () => {
  let service: ChatsService;
  let mockRedisDataClient: jest.Mocked<Redis>;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockRedisSubClient: jest.Mocked<Redis>;

  const mockUserInfoRepository = { findOne: jest.fn() };

  const mockTrialsRepository = { find: jest.fn(), save: jest.fn() };
  const mockHumorsRepository = { find: jest.fn(), save: jest.fn() };
  const mockPolticalsRepository = { find: jest.fn(), save: jest.fn() };

  beforeEach(async () => {
    mockRedisDataClient = {
      publish: jest.fn().mockResolvedValue('OK'),
      quit: jest.fn().mockResolvedValue('OK'),
      scan: jest.fn().mockResolvedValue(['0', ['key1', 'key2']]),
      lrange: jest.fn().mockResolvedValue([]),
      llen: jest.fn(),
      ltrim: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      set: jest.fn(),
      rpush: jest.fn(),
      expire: jest.fn(),
    } as any;

    mockRedisSubClient = {
      subscribe: jest.fn().mockResolvedValue('OK'),
      quit: jest.fn().mockResolvedValue('OK'),
      on: jest.fn(),
    } as any;

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      }),
    } as any;

    const mockNickNameService = {
      generateNickname: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ChatsService,
        {
          provide: getRepositoryToken(UserInfos),
          useValue: mockUserInfoRepository,
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
            }),
          },
        },
        {
          provide: getRepositoryToken(TrialsChat),
          useValue: mockTrialsRepository,
        },
        {
          provide: getRepositoryToken(HumorsChat),
          useValue: mockHumorsRepository,
        },
        {
          provide: getRepositoryToken(PolticalsChat),
          useValue: mockPolticalsRepository,
        },
        { provide: 'REDIS_DATA_CLIENT', useValue: mockRedisDataClient },
        { provide: 'REDIS_SUB_CLIENT', useValue: mockRedisSubClient },
        { provide: DataSource, useValue: mockDataSource },
        {
          provide: getModelToken('Chat'),
          useValue: mockChatModel,
        },
        {
          provide: NicknameGeneratorService,
          useValue: mockNickNameService,
        },
      ],
    }).compile();
    function mockRepository() {
      return {
        findOne: jest.fn().mockImplementation(({ where: { id } }) => ({
          id: id,
          nickName: `User${id}`,
        })),
      };
    }
    service = module.get<ChatsService>(ChatsService);
    mockDataSource = module.get(DataSource);
  });

  describe('publishNotification', () => {
    it('should publish a notification message to the notifications channel', async () => {
      const testMessage = 'Hello, world!';
      await service.publishNotification(testMessage);

      expect(mockRedisDataClient.publish).toHaveBeenCalledWith(
        'notifications',
        testMessage,
      );
    });
  });

  describe('onModuleInit', () => {
    it('should call handleScheduledTasks method', async () => {
      const handleScheduledTasksSpy = jest.spyOn(
        service,
        'handleScheduledTasks',
      );

      await service.onModuleInit();

      expect(handleScheduledTasksSpy).toHaveBeenCalled();

      handleScheduledTasksSpy.mockRestore();
    });
  });

  describe('handleScheduledTasks', () => {
    it('should process keys for each channel type', async () => {
      //   const channelType = 'trials';
      const scanMock = mockRedisDataClient.scan.mockResolvedValue([
        '0',
        ['key1', 'key2'],
      ]);
      const processKeySpy = jest
        .spyOn(service, 'processKey')
        .mockResolvedValue();

      await service.handleScheduledTasks();

      Object.values(ChannelType).forEach((channelType) => {
        expect(scanMock).toHaveBeenCalledWith(
          '0',
          'MATCH',
          `${channelType}:*`,
          'COUNT',
          100,
        );
      });

      expect(processKeySpy).toHaveBeenCalledWith('key1');
      expect(processKeySpy).toHaveBeenCalledWith('key2');

      processKeySpy.mockRestore();
    });
  });
  describe('processKey', () => {
    it('should process messages and trim the list when messages exist', async () => {
      const key = 'channelType:roomId';
      const messages = ['message1', 'message2', 'message3'];

      // 'lrange'를 모킹하여 메시지 배열을 반환하도록 설정
      mockRedisDataClient.lrange.mockResolvedValue(messages);

      // 'saveMessagesToDatabase' 메서드 스파이
      const saveMessagesToDatabaseSpy = jest
        .spyOn(service, 'saveMessagesToDatabase')
        .mockResolvedValue();

      await service.processKey(key);

      // 'saveMessagesToDatabase'가 호출되었는지 검증
      expect(saveMessagesToDatabaseSpy).toHaveBeenCalledWith(
        messages,
        key,
        expect.any(Number),
      );

      // 'ltrim'이 호출되었는지 검증
      expect(mockRedisDataClient.ltrim).toHaveBeenCalledWith(key, -50, -1);
    });

    it('should not trim the list or save messages when no messages exist', async () => {
      const key = 'channelType:roomId';
      const messages = [];

      mockRedisDataClient.lrange.mockResolvedValue(messages);

      const saveMessagesToDatabaseSpy = jest
        .spyOn(service, 'saveMessagesToDatabase')
        .mockResolvedValue();

      await service.processKey(key);

      // 'saveMessagesToDatabase'가 호출되지 않았는지 검증
      expect(saveMessagesToDatabaseSpy).not.toHaveBeenCalled();

      // 'ltrim'이 호출되지 않았는지 검증
      expect(mockRedisDataClient.ltrim).not.toHaveBeenCalled();
    });
  });
  describe('createChannelChat', () => {
    it('should create a new chat in the channel and publish it', async () => {
      const channelType = 'trials';
      const userId = 1;
      const message = 'Hello, World!';
      const roomId = 123;
      const userNickName = 'TestUser';
      const ip = '127.0.0.1';

      mockUserInfoRepository.findOne.mockResolvedValue({
        id: userId,
        nickName: userNickName,
      });

      mockRedisDataClient.rpush.mockResolvedValue(null);
      mockRedisDataClient.expire.mockResolvedValue(null);
      mockRedisDataClient.publish.mockResolvedValue(null);

      await service.createChannelChat(channelType, userId, message, roomId, ip);

      const expectedChatValue = JSON.stringify({
        message,
        userId,
        RoomId: roomId,
        timestamp: expect.any(String),
        userName: userNickName,
      });

      expect(mockRedisDataClient.rpush).toHaveBeenCalledWith(
        `${channelType}:chat:${roomId}`,
        expect.stringMatching(
          new RegExp(
            `^{"message":"Hello, World!","userId":1,"RoomId":123,"timestamp":"\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z","userName":"TestUser"}$`,
          ),
        ),
      );

      expect(mockRedisDataClient.publish).toHaveBeenCalledWith(
        `${channelType}:chat:${roomId}`,
        expect.stringMatching(
          new RegExp(
            `^{"message":"Hello, World!","userId":1,"RoomId":123,"timestamp":"\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z","userName":"TestUser"}$`,
          ),
        ),
      );
    });

    it('should throw an error if the chat creation fails', async () => {
      const errorMessage = 'Error creating chat';
      mockUserInfoRepository.findOne.mockRejectedValue(new Error(errorMessage));

      await expect(
        service.createChannelChat(
          'testChannel',
          1,
          'Hello, World!',
          123,
          '127',
        ),
      ).rejects.toThrow(errorMessage);
    });
  });
  describe('getChannel', () => {
    it('should retrieve chats from Redis and MongoDB correctly', async () => {
      const channelType = 'general';
      const roomId = 123;
      const page = 0;
      const limit = 50;

      // Setting up mock responses
      const redisMessages = [
        JSON.stringify({
          message: 'Hello from Redis',
          timestamp: new Date().toISOString(),
        }),
      ];
      const dbMessages = [{ message: 'Hello from DB', timestamp: new Date() }];

      mockRedisDataClient.llen.mockResolvedValue(1);
      mockRedisDataClient.lrange.mockResolvedValue(redisMessages);
      mockChatModel.exec.mockResolvedValue(dbMessages);

      const results = await service.getChannel(
        channelType,
        roomId,
        page,
        limit,
      );

      expect(mockRedisDataClient.llen).toHaveBeenCalledWith(
        `${channelType}:chat:${roomId}`,
      );
      expect(mockRedisDataClient.lrange).toHaveBeenCalledWith(
        `${channelType}:chat:${roomId}`,
        0,
        -1,
      );
      expect(mockChatModel.find).toHaveBeenCalledWith({ RoomId: roomId });
      expect(mockChatModel.sort).toHaveBeenCalledWith({ timestamp: 'asc' });
      expect(mockChatModel.skip).toHaveBeenCalledWith(0);
      expect(mockChatModel.limit).toHaveBeenCalledWith(limit);
      expect(results).toEqual([
        ...redisMessages.map((msg) => JSON.parse(msg)),
        ...dbMessages,
      ]);
    });

    it('should handle database errors gracefully', async () => {
      const channelType = 'general';
      const roomId = 123;
      const page = 0;
      const limit = 50;

      mockChatModel.exec.mockRejectedValue(new Error('Database fetch error'));

      await expect(
        service.getChannel(channelType, roomId, page, limit),
      ).rejects.toThrow('Database fetch error');
    });
  });

  it('should publish an event with the given roomId, event, and data', async () => {
    const roomId = 123;
    const event = 'testEvent';
    const data = { message: 'Hello, world!' };

    await service.publishEvent(roomId, event, data);

    // 올바른 채널 이름과 메시지로 publish 함수가 호출되었는지 확인
    expect(mockRedisDataClient.publish).toHaveBeenCalledWith(
      `roomEvents:${roomId}`,
      JSON.stringify({ event, data }),
    );
  });
  describe('publishEvent', () => {
    // 선택적: publish 함수 호출 중 예외 발생 시 적절한 처리가 이루어지는지 테스트
    it('should handle errors when publishing an event fails', async () => {
      const roomId = 123;
      const event = 'testEvent';
      const data = { message: 'Hello, world!' };
      const errorMessage = 'Redis error';

      // Redis publish 함수 호출 시 에러를 시뮬레이션
      mockRedisDataClient.publish.mockRejectedValue(new Error(errorMessage));

      // publishEvent 호출 시 예외가 발생하면 이를 적절히 처리하는지 (예: 로깅, 예외 전파 등) 검증
      await expect(service.publishEvent(roomId, event, data)).rejects.toThrow(
        errorMessage,
      );
    });
  });
  describe('saveMessagesToDatabase', () => {
    it('should save messages to the database for the given channel type', async () => {
      const messages = [
        JSON.stringify({
          userId: 1,
          message: 'Hello',
          timestamp: new Date().toISOString(),
        }),
      ];
      const channelType = 'trials';
      const roomId = 123;
      const redisKey = `${channelType}:${roomId}`;
      const userName = 'TestUser';

      mockUserInfoRepository.findOne.mockResolvedValue({ nickName: userName });

      await service.saveMessagesToDatabase(messages, channelType, roomId);

      expect(mockTrialsRepository.save).toHaveBeenCalled();

      const queryRunner = mockDataSource.createQueryRunner();
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
    it('should save messages to the database for the given channel type', async () => {
      const messages = [
        JSON.stringify({
          userId: 1,
          message: 'Hello',
          timestamp: new Date().toISOString(),
        }),
      ];
      const channelType = 'humors';
      const roomId = 123;
      const redisKey = `${channelType}:${roomId}`;
      const userName = 'TestUser';

      mockUserInfoRepository.findOne.mockResolvedValue({ nickName: userName });

      await service.saveMessagesToDatabase(messages, channelType, roomId);

      expect(mockHumorsRepository.save).toHaveBeenCalled();

      const queryRunner = mockDataSource.createQueryRunner();
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
    it('should save messages to the database for the given channel type1', async () => {
      const messages = [
        JSON.stringify({
          userId: 1,
          message: 'Hello',
          timestamp: new Date().toISOString(),
        }),
      ];
      const channelType = 'polticals';
      const roomId = 123;
      const redisKey = `${channelType}:${roomId}`;
      const userName = 'TestUser';

      mockUserInfoRepository.findOne.mockResolvedValue({ nickName: userName });

      await service.saveMessagesToDatabase(messages, channelType, roomId);

      expect(mockPolticalsRepository.save).toHaveBeenCalled();

      const queryRunner = mockDataSource.createQueryRunner();
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should handle error when fetching user info fails', async () => {
      const errorMessage = 'Error fetching user info';
      const messages = [
        JSON.stringify({
          userId: 1,
          message: 'Hello',
          timestamp: new Date().toISOString(),
        }),
      ];
      const channelType = 'polticals';
      const roomId = 123;
      const redisKey = `${channelType}:${roomId}`;
      const userName = 'TestUser';

      mockUserInfoRepository.findOne.mockRejectedValue(new Error(errorMessage));

      await expect(
        service.saveMessagesToDatabase(messages, 'trials', roomId),
      ).rejects.toThrow(errorMessage);
    });
  });
});
