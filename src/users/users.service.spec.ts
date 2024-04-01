import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import { UserInfos } from './entities/user-info.entity';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository = {
    findByEmail: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const mockUserInfoRepository = {
    update: jest.fn(),
    delete: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
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
        // { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });
  describe('유저 조회', () => {
    it('성공적으로 조회', async () => {
      const user = { id: 1, email: 'test@example.com', name: 'Test User' };
      mockUserInfoRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail(user.email);

      expect(mockUserInfoRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockUserInfoRepository.findOne).toHaveBeenCalledWith({
        select: ['id', 'password', 'email'],
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
      mockUserInfoRepository.findOneBy.mockResolvedValue(user.id);
      mockUserInfoRepository.delete.mockResolvedValue(user);

      await expect(service.userDelete(user.id)).resolves.not.toThrow();

      expect(mockUserInfoRepository.delete).toHaveBeenCalledTimes(1);
      expect(mockUserInfoRepository.findOneBy).toHaveBeenCalledTimes(1);
      expect(mockUserInfoRepository.findOneBy).toHaveBeenCalledWith({
        id: user.id,
      });
      expect(mockUserInfoRepository.delete).toHaveBeenCalledWith(user.id);
    });
    it('아이디가 없음', async () => {
      mockUserInfoRepository.findOneBy.mockResolvedValue(null);
      mockUserInfoRepository.delete.mockResolvedValue(user);
      await expect(service.userDelete(user.id)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockUserInfoRepository.findOneBy).toHaveBeenCalledTimes(1);
    });
  });
});
