import { Test } from '@nestjs/testing';
import { ChatsService } from './chats.service';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { UserInfos } from '../users/entities/user-info.entity';
import { TrialsChat } from '../events/entities/trialsChat.entity';
import { HumorsChat } from '../events/entities/humorsChat.entity';
import { PolticalsChat } from '../events/entities/polticalsChat.entity';
import { ChannelType } from '../events/type/channeltype';

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
        'channelType',
        expect.any(Number),
        key,
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

      // usersInfoRepository의 findOne 메소드를 모킹하여 사용자 정보 반환 설정
      mockUserInfoRepository.findOne.mockResolvedValue({
        id: userId,
        nickName: userNickName,
      });

      // Redis 메소드 모킹
      mockRedisDataClient.rpush = jest.fn().mockResolvedValue(null);
      mockRedisDataClient.expire = jest.fn().mockResolvedValue(null);
      mockRedisDataClient.publish = jest.fn().mockResolvedValue(null);

      // createChannelChat 메소드 실행
      await service.createChannelChat(channelType, userId, message, roomId);

      // usersInfoRepository.findOne 검증
      expect(mockUserInfoRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        select: ['nickName'],
      });

      // Redis 메소드 호출 검증
      // rpush와 publish 호출을 위해 전달된 인자 검증
      const chatValueRegex = new RegExp(
        `{"message":"${message}","userId":${userId},"RoomId":${roomId},"timestamp":"\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d\\.\\d+Z","userName":"${userNickName}"}`,
      );

      expect(mockRedisDataClient.rpush).toHaveBeenCalledWith(
        `${channelType}:chat:${roomId}`,
        expect.stringMatching(chatValueRegex),
      );

      expect(mockRedisDataClient.publish).toHaveBeenCalledWith(
        `${channelType}:chat:${roomId}`,
        expect.stringMatching(chatValueRegex),
      );
    });

    it('should create a new chat in the channel and publish it', async () => {
      const channelType = 'polticals';
      const userId = 1;
      const message = 'Hello, World!';
      const roomId = 123;
      const userNickName = 'TestUser';
      const now = new Date();

      // usersInfoRepository의 findOne 메소드를 모킹하여 사용자 정보 반환 설정
      mockUserInfoRepository.findOne.mockResolvedValue({
        id: userId,
        nickName: userNickName,
      });

      // Redis 메소드 모킹
      mockRedisDataClient.rpush = jest.fn().mockResolvedValue(null);
      mockRedisDataClient.expire = jest.fn().mockResolvedValue(null);
      mockRedisDataClient.publish = jest.fn().mockResolvedValue(null);

      // createChannelChat 메소드 실행
      const result = await service.createChannelChat(
        channelType,
        userId,
        message,
        roomId,
      );

      // usersInfoRepository.findOne 검증
      expect(mockUserInfoRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        select: ['nickName'],
      });

      // Redis 메소드 호출 검증
      const expectedChatValue = JSON.stringify({
        message,
        userId,
        RoomId: roomId,
        timestamp: now.toISOString(),
        userName: userNickName,
      });

      expect(mockRedisDataClient.rpush).toHaveBeenCalledWith(
        `${channelType}:chat:${roomId}`,
        expectedChatValue,
      );
      expect(mockRedisDataClient.expire).toHaveBeenCalledWith(
        `${channelType}:chat:${roomId}`,
        60 * 60 * 24 * 2,
      );
      expect(mockRedisDataClient.publish).toHaveBeenCalledWith(
        `${channelType}:chat:${roomId}`,
        expectedChatValue,
      );

      // 반환값 검증
      expect(result).toEqual({ id: userId, nickName: userNickName });
    });

    it('should create a new chat in the channel and publish it', async () => {
      const channelType = 'humors';
      const userId = 1;
      const message = 'Hello, World!';
      const roomId = 123;
      const userNickName = 'TestUser';
      const now = new Date();

      // usersInfoRepository의 findOne 메소드를 모킹하여 사용자 정보 반환 설정
      mockUserInfoRepository.findOne.mockResolvedValue({
        id: userId,
        nickName: userNickName,
      });

      // Redis 메소드 모킹
      mockRedisDataClient.rpush = jest.fn().mockResolvedValue(null);
      mockRedisDataClient.expire = jest.fn().mockResolvedValue(null);
      mockRedisDataClient.publish = jest.fn().mockResolvedValue(null);

      // createChannelChat 메소드 실행
      const result = await service.createChannelChat(
        channelType,
        userId,
        message,
        roomId,
      );

      // usersInfoRepository.findOne 검증
      expect(mockUserInfoRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        select: ['nickName'],
      });

      // Redis 메소드 호출 검증
      const expectedChatValue = JSON.stringify({
        message,
        userId,
        RoomId: roomId,
        timestamp: now.toISOString(),
        userName: userNickName,
      });

      expect(mockRedisDataClient.rpush).toHaveBeenCalledWith(
        `${channelType}:chat:${roomId}`,
        expectedChatValue,
      );
      expect(mockRedisDataClient.expire).toHaveBeenCalledWith(
        `${channelType}:chat:${roomId}`,
        60 * 60 * 24 * 2,
      );
      expect(mockRedisDataClient.publish).toHaveBeenCalledWith(
        `${channelType}:chat:${roomId}`,
        expectedChatValue,
      );

      // 반환값 검증
      expect(result).toEqual({ id: userId, nickName: userNickName });
    });

    it('should throw an error if the chat creation fails', async () => {
      const errorMessage = 'Error creating chat';
      mockUserInfoRepository.findOne.mockRejectedValue(new Error(errorMessage));

      await expect(
        service.createChannelChat('testChannel', 1, 'Hello, World!', 123),
      ).rejects.toThrow(errorMessage);
    });
  });
  describe('getChannel', () => {
    it('should return messages from Redis and 123the database', async () => {
      const channelType = 'trials';
      const roomId = 1;
      const page = 0;
      const limit = 50;

      const redisMessages = [
        JSON.stringify({ message: 'Hello from Redis', timestamp: new Date() }),
      ];
      const dbMessages = [{ message: 'Hello from DB', timestamp: new Date() }];

      mockRedisDataClient.llen.mockResolvedValue(redisMessages.length);
      mockRedisDataClient.lrange.mockResolvedValue(redisMessages);
      mockTrialsRepository.find.mockResolvedValue(dbMessages);

      const result = await service.getChannel(channelType, roomId, page, limit);

      expect(mockRedisDataClient.llen).toHaveBeenCalledWith(
        `${channelType}:chat:${roomId}`,
      );
      expect(mockRedisDataClient.lrange).toHaveBeenCalledWith(
        `${channelType}:chat:${roomId}`,
        0,
        -1,
      );
      expect(mockTrialsRepository.find).toHaveBeenCalledWith({
        where: { roomId: roomId },
        order: { timestamp: 'ASC' },
        skip: 0,
        take: limit,
      });

      expect(result).toEqual([
        ...redisMessages.map((msg) => JSON.parse(msg)),
        ...dbMessages,
      ]);
    });
    it('should return messages from Redis and12 the database', async () => {
      const channelType = 'humors';
      const roomId = 1;
      const page = 0;
      const limit = 50;

      const redisMessages = [
        JSON.stringify({ message: 'Hello from Redis', timestamp: new Date() }),
      ];
      const dbMessages = [{ message: 'Hello from DB', timestamp: new Date() }];

      mockRedisDataClient.llen.mockResolvedValue(redisMessages.length);
      mockRedisDataClient.lrange.mockResolvedValue(redisMessages);
      mockHumorsRepository.find.mockResolvedValue(dbMessages);

      const result = await service.getChannel(channelType, roomId, page, limit);

      expect(mockRedisDataClient.llen).toHaveBeenCalledWith(
        `${channelType}:chat:${roomId}`,
      );
      expect(mockRedisDataClient.lrange).toHaveBeenCalledWith(
        `${channelType}:chat:${roomId}`,
        0,
        -1,
      );
      expect(mockHumorsRepository.find).toHaveBeenCalledWith({
        where: { roomId: roomId },
        order: { timestamp: 'ASC' },
        skip: 0,
        take: limit,
      });

      expect(result).toEqual([
        ...redisMessages.map((msg) => JSON.parse(msg)),
        ...dbMessages,
      ]);
    });
    it('should return messages from Redis and the database', async () => {
      const channelType = 'poltical-debates';
      const roomId = 1;
      const page = 0;
      const limit = 50;

      const redisMessages = [
        JSON.stringify({ message: 'Hello from Redis', timestamp: new Date() }),
      ];
      const dbMessages = [{ message: 'Hello from DB', timestamp: new Date() }];

      mockRedisDataClient.llen.mockResolvedValue(redisMessages.length);
      mockRedisDataClient.lrange.mockResolvedValue(redisMessages);
      mockPolticalsRepository.find.mockResolvedValue(dbMessages);

      const result = await service.getChannel(channelType, roomId, page, limit);

      expect(mockRedisDataClient.llen).toHaveBeenCalledWith(
        `${channelType}:chat:${roomId}`,
      );
      expect(mockRedisDataClient.lrange).toHaveBeenCalledWith(
        `${channelType}:chat:${roomId}`,
        0,
        -1,
      );
      expect(mockPolticalsRepository.find).toHaveBeenCalledWith({
        where: { roomId: roomId },
        order: { timestamp: 'ASC' },
        skip: 0,
        take: limit,
      });

      expect(result).toEqual([
        ...redisMessages.map((msg) => JSON.parse(msg)),
        ...dbMessages,
      ]);
    });
    it('should throw an error if there is an error fetching messages from the database', async () => {
      const channelType = 'trials';
      const roomId = 1;
      const errorMessage = 'Database error';

      mockRedisDataClient.llen.mockResolvedValue(0);
      mockTrialsRepository.find.mockRejectedValue(new Error(errorMessage));

      await expect(service.getChannel(channelType, roomId)).rejects.toThrow(
        errorMessage,
      );
    });
    it('should return messages from the database if Redis is empty', async () => {
      const channelType = 'trials';
      const roomId = 1;
      const page = 0;
      const limit = 50;

      const dbMessages = [
        { message: 'Hello from DB 1', timestamp: new Date() },
        { message: 'Hello from DB 2', timestamp: new Date() },
      ];

      // Redis에 메시지가 없다고 가정
      mockRedisDataClient.llen.mockResolvedValue(0);
      // DB에서 메시지를 가져온다고 가정
      mockTrialsRepository.find.mockResolvedValue(dbMessages);

      const result = await service.getChannel(channelType, roomId, page, limit);

      expect(result).toEqual(dbMessages);
      expect(mockTrialsRepository.find).toHaveBeenCalledWith({
        where: { roomId: roomId },
        order: { timestamp: 'ASC' },
        skip: 0,
        take: limit,
      });
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

      await service.saveMessagesToDatabase(
        messages,
        channelType,
        roomId,
        redisKey,
      );

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

      await service.saveMessagesToDatabase(
        messages,
        channelType,
        roomId,
        redisKey,
      );

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

      await service.saveMessagesToDatabase(
        messages,
        channelType,
        roomId,
        redisKey,
      );

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
        service.saveMessagesToDatabase(messages, 'trials', roomId, redisKey),
      ).rejects.toThrow(errorMessage);
    });
  });
});
