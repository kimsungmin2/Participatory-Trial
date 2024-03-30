import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserInfos } from '../users/entities/user-info.entity';
import { Users } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { EmailService } from '../email/email.service';
import { DataSource } from 'typeorm';

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
    id: 1,
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
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
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
        { provide: EmailService, useValue: { sendEmail: jest.fn() } },
        { provide: JwtService, useValue: mockJwtService },
        { provide: DataSource, useValue: mockDataSource },
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
      refreshToken: expectedRefreshToken,
    });
  });

  describe('간편 가입 테스트', () => {
    it('성공적으로 프로바이더 사용자를 생성한다', async () => {
      const email = 'test@example.com';
      const nickName = 'testNickName';
      const provider = 'provider';

      const result = await service.createProviderUser(
        email,
        nickName,
        provider,
      );

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        password: 'default',
        nickName: 'testNickName',
        provider: 'provider',
        birth: 'default',
        verifiCationCode: 0,
        emailVerified: true,
      });
      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });

    describe('이메일 인증 테스트', () => {
      const verifiCation = { email: 'test@example.com', code: 12345 };
      const user = {
        id: 1,
        email: 'test@example.com',
        verifiCationCode: 12345,
        emailVerified: false,
      };
      it('인증 코드가 일치하는 경우 이메일을 성공적으로 인증한다', async () => {
        mockUsersService.findByEmail.mockResolvedValue(user);
        mockUserInfoRepository.update.mockResolvedValue({ affected: 1 });

        await service.verifiCationEmail(verifiCation);

        expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
          verifiCation.email,
        );
        expect(mockUserInfoRepository.update).toHaveBeenCalledWith(user.id, {
          emailVerified: true,
        });
      });

      it('인증 코드가 일치하지 않는 경우 ConflictException을 발생시킨다', async () => {
        const testVerifiCation = { email: 'test@example.com', code: 12312345 };
        mockUsersService.findByEmail.mockResolvedValue(user);

        await expect(
          service.verifiCationEmail(testVerifiCation),
        ).rejects.toThrow(ConflictException);

        expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
          verifiCation.email,
        );
      });
    });
    describe('login', () => {
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
        console.log(password);
        console.log(user.password);
        const result = await service.login(user.email, password);

        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('refreshToken');
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
  });
  describe('회원가입(signUp) 테스트', () => {
    it('이미 존재하는 이메일로 가입 시도할 경우 에러를 발생시킨다', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        email: 'test@email.com',
      });
      mockUsersService.findByEmail.mockResolvedValue(user);

      await expect(
        service.signUp(
          'test@email.com',
          signUpdto.password,
          signUpdto.passwordConfirm,
          signUpdto.nickName,
          signUpdto.birth,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('비밀번호와 확인 비밀번호가 일치하지 않을 경우 에러를 발생시킴', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.signUp(
          user.email,
          user.password,
          user.nickName,
          user.birth,
          'asdf',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  it('모든 조건이 충족되면 회원가입을 성공적으로 완료한다', async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);
    mockEmailService.sendVerificationToEmail.mockResolvedValue(undefined);
    // expect(bcrypt.hash).toHaveBeenCalledWith(signUpdto.password, 10);
    mockQueryRunner.manager
      .getRepository(Users)
      .save.mockResolvedValue({ id: 1 });
    mockQueryRunner.manager.getRepository(UserInfos).save.mockResolvedValue({
      id: 1,
      ...signUpdto,
      password: signUpdto.password,
    });

    const result = await service.signUp(
      signUpdto.email,
      signUpdto.password,
      signUpdto.passwordConfirm,
      signUpdto.nickName,
      signUpdto.birth,
    );

    expect(mockUsersService.findByEmail).toHaveBeenCalledWith(signUpdto.email);

    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });
});
