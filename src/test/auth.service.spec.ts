import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserInfos } from '../users/entities/user-info.entity';
import { Users } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../email/email.service';
import { DataSource } from 'typeorm';
import { RedisService } from '../cache/redis.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest
    .fn()
    .mockImplementation((inputPassword, hashedPassword) =>
      inputPassword === 'correctPassword'
        ? Promise.resolve(true)
        : Promise.resolve(false),
    ),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userService: UsersService;

  const signUpdto = {
    email: 'test@example.com',
    password: 'Password123',
    passwordConfirm: 'Password123',
    nickName: 'testNickName',
    birth: '2000-01-01',
  };

  const mockUserRepository = {
    save: jest.fn(),
    findByEmail: jest.fn(),
  };
  const mockUserInfoRepository = {
    findByEmail: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
  };
  const mockJwtService = {
    sign: jest.fn(),
  };
  const mockUsersService = {
    findByEmail: jest.fn(),
  };
  const mockEmailService = {
    sendVerificationToEmail: jest.fn(),
    queueVerificationEmail: jest.fn(),
  };
  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === Users) {
          return {
            save: jest.fn().mockResolvedValue({ id: 1 }),
          };
        } else if (entity === UserInfos) {
          return {
            save: jest.fn().mockResolvedValue({
              id: 1,
              email: 'test@example.com',
              password: 'default',
              nickName: 'testNickName',
              provider: 'provider',
              birth: 'default',
              verifiCationCode: 0,
              emailVerified: true,
            }),
          };
        }
      }),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        getRepository: jest.fn().mockImplementation((entity) => {
          if (entity === Users) {
            return {
              delete: jest.fn(),
              save: jest.fn().mockResolvedValue(new Users()),
            };
          } else if (entity === UserInfos) {
            return {
              delete: jest.fn(),
              save: jest.fn().mockResolvedValue({
                id: 1,
                email: 'test@example.com',
                password: 'default',
                nickName: 'testNickName',
                provider: 'provider',
                birth: 'default',
                emailVerified: true,
                user: { id: 1 },
              }),
            };
          }
        }),
      },
    })),
  };

  jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');

  // const signUpdto = {
  //   id: 1,
  //   email: 'test@gmail.com',
  //   password: 'hashedPassword',
  //   nickName: 'test',
  //   birth: '1996-05-24',
  //   passwordConfirm: 'hashedPassword',
  // };

  const user = {
    id: 2,
    email: 'test@gmail.com',
    password: 'hashedPassword',
    nickName: 'test',
    passwordConfirm: 'hashedPassword',
    birth: '1996-05-24',
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        { provide: getRepositoryToken(Users), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(UserInfos),
          useValue: mockUserInfoRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        { provide: EmailService, useValue: mockEmailService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: DataSource, useValue: mockDataSource },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // describe('회원가입 테스트', () => {
  //   it('회원가입 테스트', () => {});
  // });

  describe('유저 있는지 확인', () => {
    it('성공적으로 찾았는지 ', async () => {
      mockUsersService.findByEmail.mockResolvedValue(user);

      const result = await service.validateUser(user.email);

      expect(mockUsersService.findByEmail).toHaveBeenCalledTimes(1);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(user.email);
      expect(result).toEqual(user);
    });
    it('사용자를 찾을 수 없을 경우 null을 반환한다', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(user.email);

      expect(mockUsersService.findByEmail).toHaveBeenCalledTimes(2);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(user.email);
      expect(result).toBeNull();
    });
  });

  it('createToken은 유효한 액세스 토큰과 리프레시 토큰을 생성한다', async () => {
    const expectedAccessToken = 'expectedAccessToken';
    const expectedRefreshToken = 'expectedRefreshToken';

    mockUsersService.findByEmail.mockResolvedValue(user);
    mockJwtService.sign
      .mockReturnValueOnce(expectedAccessToken)
      .mockReturnValueOnce(expectedRefreshToken);

    const tokens = await service.createToken(user.email);

    expect(mockUsersService.findByEmail).toHaveBeenCalledWith(user.email);
    expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    expect(tokens).toEqual({
      accessToken: expectedAccessToken,
    });
  });

  describe('간편가입', () => {
    it('가입에 성공', async () => {
      const email = 'test@example.com';
      const nickName = 'testNickName';
      const provider = 'provider';

      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

      const userInfo = await service.createProviderUser(
        email,
        nickName,
        provider,
      );

      expect(userInfo).toBeDefined();
      expect(userInfo.email).toBe(email);
      expect(userInfo.nickName).toBe(nickName);
      expect(userInfo.provider).toBe(provider);

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('에러가 나는지', async () => {
      const email = 'test@example.com';
      const nickName = 'testNickName';
      const provider = 'provider';

      const mockQueryRunner = {
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
        manager: {
          getRepository: jest.fn().mockImplementation((entity) => {
            if (entity === Users) {
              return { save: jest.fn().mockResolvedValue({ id: 1 }) };
            } else if (entity === UserInfos) {
              return {
                save: jest.fn().mockRejectedValue(new Error('Database error')),
              };
            }
          }),
        },
      };
      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

      try {
        const result = await service.createProviderUser(
          email,
          nickName,
          provider,
        );
        expect(result).toBeUndefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Database error');
      }

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('로그인', () => {
    const user = {
      email: 'test@email.com',
      password: 'hashedPassword',
      emailVerified: true,
    };
    const password = 'correctPassword';
    it('성공적인 로그인', async () => {
      const password = 'correctPassword';
      mockUserInfoRepository.findOne.mockResolvedValue(user.email);
      // bcrypt.compare(user.password, password);
      mockJwtService.sign.mockReturnValue('token');
      const result = await service.login(user.email, password);

      expect(result).toHaveProperty('accessToken');
      expect(mockJwtService.sign).toHaveBeenCalledTimes(4);
    });
    it('이메일 인증이 완료되지 않았다면 에러를 발생시킨다', async () => {
      mockUserInfoRepository.findOne.mockResolvedValue({
        ...user,
        emailVerified: false,
      });

      await expect(service.login(user.email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('이메일이 존재하지 않을 경우 에러를 발생시킨다', async () => {
      mockUserInfoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login('nonexistent@example.com', password),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('비밀번호가 일치하지 않으면 에러를 발생시킨다', async () => {
      mockUserInfoRepository.findOne.mockResolvedValue({
        email: user.email,
        password: 'hashedPassword',
      });

      await expect(service.login(user.email, '1234asd')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('회원가입', () => {
    it('이미 있는 사용자', async () => {
      jest.spyOn(mockUsersService, 'findByEmail').mockResolvedValue({
        emailVerified: true,
      });

      await expect(
        service.signUp(
          'test@example.com',
          'Password123',
          'Password123',
          'nickname',
          '2000-01-01',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('비밀번호가 맞는지', async () => {
      jest.spyOn(mockUsersService, 'findByEmail').mockResolvedValue(null);

      await expect(
        service.signUp(
          'test@example.com',
          'Password123',
          'Password321',
          'nickname',
          '2000-01-01',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('모든 조건이 충족되면 회원가입을 성공적으로 완료한다', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const mockCommitTransaction = jest.fn().mockResolvedValue(undefined);
      const mockRelease = jest.fn().mockResolvedValue(undefined);

      mockDataSource.createQueryRunner.mockReturnValue({
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: mockCommitTransaction,
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: mockRelease,
        manager: {
          getRepository: jest.fn().mockImplementation((entity) => ({
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
            save: jest
              .fn()
              .mockResolvedValue({ id: 1, email: 'test@example.com' }),
          })),
        },
      });

      await expect(
        service.signUp(
          'test@example.com',
          'Password123',
          'Password123',
          'testNickName',
          '2000-01-01',
        ),
      ).resolves.not.toThrow();

      // commitTransaction과 release가 호출되었는지 확인
      expect(mockCommitTransaction).toHaveBeenCalled();
      expect(mockRelease).toHaveBeenCalled();
    });
  });
  describe('이메일 인증', () => {
    const verifiCationDto = {
      email: 'test@example.com',
      code: 123456,
    };

    it('성공적으로 이메일 인증을 완료한다', async () => {
      const verifiCation = { id: 1, email: 'test@example.com', code: 123456 };
      mockUsersService.findByEmail.mockResolvedValue({
        id: 1,
        email: verifiCation.email,
      });
      mockRedisCluster.get.mockResolvedValue(verifiCation.code.toString());
      mockUserInfoRepository.update.mockResolvedValue({});

      await service.verifiCationEmail(verifiCation);

      expect(mockUserInfoRepository.update).toHaveBeenCalledWith(
        verifiCation.id,
        { emailVerified: true },
      );
      expect(mockRedisCluster.del).toHaveBeenCalledWith(verifiCation.email);
    });

    it('사용자를 찾을 수 없을 경우 NotFoundException을 발생시킨다', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.verifiCationEmail(verifiCationDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('인증 코드가 만료되었거나 존재하지 않을 경우 NotFoundException을 발생시킨다', async () => {
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockRedisCluster.get.mockResolvedValue(null);

      await expect(service.verifiCationEmail(verifiCationDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('제공된 인증 코드가 일치하지 않을 경우 ConflictException을 발생시킨다', async () => {
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockRedisCluster.get.mockResolvedValue(654321);

      await expect(service.verifiCationEmail(verifiCationDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
  describe('성공 케이스', () => {
    it('새로운 토큰을 생성하고, 이전 리프레시 토큰을 캐시에서 삭제한 후 새 리프레시 토큰을 캐시에 저장해야 한다', async () => {
      const oldRefreshToken = 'oldRefreshToken';
      const userId = '1';
      mockRedisCluster.get.mockResolvedValue(userId);

      const result = await service.refreshToken(oldRefreshToken);

      expect(mockRedisCluster.get).toHaveBeenCalledWith(
        `refresh_token:${oldRefreshToken}`,
      );
      expect(mockJwtService.sign).toHaveBeenCalledTimes(6);
      expect(mockRedisCluster.del).toHaveBeenCalledWith(
        `refresh_token:${oldRefreshToken}`,
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  it('리프레시 토큰이 캐시에 없는 경우 UnauthorizedException을 발생시켜야 한다', async () => {
    const oldRefreshToken = 'nonExistingRefreshToken';
    mockRedisCluster.get.mockResolvedValue(null);

    await expect(service.refreshToken(oldRefreshToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });
  describe('캐시에 저장', () => {
    it('코드가 있으면 기존꺼 삭제', async () => {
      const email = 'test@example.com';
      const existingCode = '123456';
      mockRedisCluster.get.mockResolvedValue(existingCode);

      await service.AuthenticationNumberCache(email);

      expect(mockRedisCluster.get).toHaveBeenCalledWith(email);
      expect(mockRedisCluster.del).toHaveBeenCalledWith(email);
      expect(mockRedisCluster.set).toHaveBeenCalled();
      expect(mockEmailService.queueVerificationEmail).toHaveBeenCalled();
    });
  });
});
