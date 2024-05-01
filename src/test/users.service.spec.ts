import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Users } from '../users/entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import { UserInfos } from '../users/entities/user-info.entity';
import { RedisService } from '../cache/redis.service';
import { Clients } from '../users/entities/client.entity';

describe('UsersService', () => {
  let service: UsersService;
  let redisService: RedisService;

  const mockUserRepository = {
    findByEmail: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
  };
  const mockUserInfoRepository = {
    update: jest.fn(),
    delete: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
  };

  const mockclientRepository = {
    delete: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const cachedUser: UserInfos = {
    id: 1,
    email: 'test@email',
    password: 'test',
    nickName: 'testName',
    birth: '1996-05-24',
    provider: 'test',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: new Users(),
  };

  const user = {
    id: 1,
    email: 'test@gmail.com',
    password: 'hashedPassword',
    nickName: 'test',
    birth: '1996-05-24',
    passwordConfirm: 'hashedPassword',
  };

  const update = {
    id: 2,
    email: 'test@gmail.com',
    password: 'hashedPassword',
    nickName: 'test1',
    introduce: 'test1',
    passwordConfirm: 'hashedPassword',
  };

  const mockRedisCluster = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockRedisService = {
    getCluster: jest.fn(() => mockRedisCluster),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(Users), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(UserInfos),
          useValue: mockUserInfoRepository,
        },
        { provide: RedisService, useValue: mockRedisService },
        {
          provide: getRepositoryToken(Clients),
          useValue: mockclientRepository,
        },
        // { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('유저 아이디 정보 조회', () => {
    it('성공적으로 조회', async () => {
      const user = { id: 1, email: 'test@example.com', name: 'Test User' };
      mockUserInfoRepository.findOne.mockResolvedValue(user);

      const result = await service.findByMyId(user.id);

      expect(mockUserInfoRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockUserInfoRepository.findOne).toHaveBeenCalledWith({
        select: ['birth', 'nickName'],
        where: { id: user.id },
      });
      expect(result).toEqual(user);
    });
  });

  describe('findById', () => {
    it('should return user data from cache if available', async () => {
      const cachedUserData = JSON.stringify({
        id: 1,
        email: 'test@email.com',
        nickName: 'testName',
        birth: '1996-05-24',
      });
      mockRedisCluster.get.mockResolvedValue(cachedUserData);

      const result = await service.findById(1);

      expect(mockRedisCluster.get).toHaveBeenCalledWith('id:1');
      expect(result).toEqual(JSON.parse(cachedUserData));
      expect(mockUserInfoRepository.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      const userId = 1;
      const userFromDb = {
        id: userId,
        email: 'test@email.com',
        nickName: 'testName',
        birth: '1996-05-24',
      };

      mockRedisCluster.get.mockResolvedValue(null);
      mockUserInfoRepository.findOne.mockResolvedValue(userFromDb);

      const result = await service.findById(userId);

      expect(mockRedisCluster.get).toHaveBeenCalledWith(`id:${userId}`);
      expect(mockUserInfoRepository.findOne).toHaveBeenCalled();
      expect(mockRedisCluster.set).toHaveBeenCalledWith(
        `id:${userId}`,
        JSON.stringify(userFromDb),
        'EX',
        60 * 60 * 24,
      );
      expect(result).toEqual(userFromDb);
    });
  });

  describe('유저 이메일 조회', () => {
    it('성공적으로 조회', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        nickName: 'Test User',
        birth: '1996-05-24',
      };
      mockUserInfoRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail(user.email);

      expect(mockUserInfoRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockUserInfoRepository.findOne).toHaveBeenCalledWith({
        select: ['id', 'nickName', 'email', 'birth', 'emailVerified'],
        where: { email: user.email },
      });
      expect(result).toEqual(user);
    });
  });

  describe('유저 업데이트', () => {
    it('업데이트 성공함', async () => {
      mockUserInfoRepository.findOneBy.mockResolvedValue(user.id);
      mockUserInfoRepository.update.mockResolvedValue(user);

      await expect(
        service.userUpdate(user.id, update.nickName),
      ).resolves.not.toThrow();

      expect(mockUserInfoRepository.update).toHaveBeenCalledTimes(1);
      expect(mockUserInfoRepository.findOneBy).toHaveBeenCalledTimes(1);
      expect(mockUserInfoRepository.findOneBy).toHaveBeenCalledWith({
        id: user.id,
      });
      expect(mockUserInfoRepository.update).toHaveBeenCalledWith(user.id, {
        nickName: update.nickName,
      });
    });
    it('유저를 못찾음', async () => {
      mockUserInfoRepository.findOneBy.mockResolvedValue(null);
      mockUserInfoRepository.update.mockResolvedValue(user);
      await expect(
        service.userUpdate(user.id, update.nickName),
      ).rejects.toThrow(NotFoundException);
    });
  });
  describe('유저 삭제', () => {
    it('삭제 성공함', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(user);

      mockUserRepository.softDelete.mockResolvedValue({ affected: 1 });

      await expect(service.userDelete(user.id)).resolves.not.toThrow();

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({
        id: user.id,
      });
      expect(mockUserRepository.softDelete).toHaveBeenCalledWith(user.id);
    });

    it('아이디가 없음', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      await expect(service.userDelete(user.id)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockUserRepository.findOneBy).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({
        id: user.id,
      });

      expect(mockUserRepository.softDelete).not.toHaveBeenCalled();
    });
  });
  describe('updateClientsInfo', () => {
    it('should create a new client if userId is null', async () => {
      const subscriptionInfo = {
        endpoint: 'example.com/endpoint',
        keys: 'keyData',
      };
      const mockClient = {
        clientId: '8c9fa6d0-bacf-42a8-aaa7-0948cfababce', // 동적으로 생성된 UUID
        endpoint: subscriptionInfo.endpoint,
        keys: subscriptionInfo.keys,
      };

      mockclientRepository.create.mockReturnValue(mockClient);
      mockclientRepository.save.mockResolvedValue(mockClient);

      const result = await service.updateClientsInfo(null, subscriptionInfo);

      expect(mockclientRepository.delete).toHaveBeenCalledWith({
        endpoint: subscriptionInfo.endpoint,
      });
      expect(mockclientRepository.create).toHaveBeenCalledWith({
        clientId: expect.any(String), // UUID의 정확한 값 대신 어떤 문자열이든 허용
        endpoint: subscriptionInfo.endpoint,
        keys: subscriptionInfo.keys,
      });
      expect(mockclientRepository.save).toHaveBeenCalledWith(mockClient);
      expect(result).toEqual(mockClient);
    });

    it('should update existing client if userId matches and endpoint changes', async () => {
      const userId = 1;
      const subscriptionInfo = {
        endpoint: 'newendpoint.com',
        keys: 'newKeyData',
      };
      const existingClient = {
        userId,
        endpoint: 'oldendpoint.com',
        keys: 'oldKeyData',
      };

      mockclientRepository.findOne.mockResolvedValue(existingClient);
      mockclientRepository.save.mockResolvedValue({
        ...existingClient,
        endpoint: subscriptionInfo.endpoint,
        keys: subscriptionInfo.keys,
      });

      const result = await service.updateClientsInfo(userId, subscriptionInfo);

      expect(mockclientRepository.delete).toHaveBeenCalledWith({
        endpoint: subscriptionInfo.endpoint,
      });
      expect(mockclientRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockclientRepository.save).toHaveBeenCalled();
      expect(result.endpoint).toBe(subscriptionInfo.endpoint);
      expect(result.keys).toBe(subscriptionInfo.keys);
    });

    it('should not create or delete anything if client exists and endpoint does not change', async () => {
      const userId = 1;
      const subscriptionInfo = {
        endpoint: 'sameendpoint.com',
        keys: 'newKeyData',
      };
      const existingClient = {
        userId,
        endpoint: subscriptionInfo.endpoint,
        keys: 'oldKeyData',
      };

      mockclientRepository.findOne.mockResolvedValue(existingClient);
      mockclientRepository.save.mockResolvedValue({
        ...existingClient,
        keys: subscriptionInfo.keys,
      });

      const result = await service.updateClientsInfo(userId, subscriptionInfo);

      expect(mockclientRepository.delete).not.toHaveBeenCalled();
      expect(mockclientRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockclientRepository.save).toHaveBeenCalled();
      expect(result.keys).toBe(subscriptionInfo.keys);
    });
  });
});
