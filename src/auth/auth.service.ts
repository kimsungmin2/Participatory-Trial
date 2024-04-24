import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserInfos } from '../users/entities/user-info.entity';
import { DataSource, Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import * as _ from 'lodash';
import { Users } from '../users/entities/user.entity';
import { VerifiCation } from './dto/verification.dto';
import { CACHE_MANAGER, Cache, CacheKey } from '@nestjs/cache-manager';
import { RedisService } from '../cache/redis.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserInfos)
    private readonly usersInfoRepository: Repository<UserInfos>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  async validateUser(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }
    return user;
  }

  async createToken(email: string) {
    const userEmail = await this.usersService.findByEmail(email);

    const refreshTokenCacheKey = `loginId:${userEmail.id}`;
    const payload = { sub: userEmail.id };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_KEY,
      expiresIn: 1000 * 60 * 60 * 12,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_SECRET,
      expiresIn: 1000 * 60 * 60 * 24 * 7,
    });

    await this.redisService
      .getCluster()
      .set(refreshTokenCacheKey, refreshToken, 'EX', 60 * 60 * 24 * 7);

    return { accessToken };
  }

  async createProviderUser(email: string, nickName: string, provider: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.getRepository(Users).save({});

      const userInfo = await queryRunner.manager.getRepository(UserInfos).save({
        id: user.id,
        email,
        password: 'default',
        nickName,
        provider,
        birth: 'default',
        emailVerified: true,
        user: user,
      });

      await queryRunner.commitTransaction();
      return userInfo;
    } catch (error) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async AuthenticationNumberCache(email: string) {
    console.log(3);
    const code = Math.floor(Math.random() * 900000) + 100000;
    let emailCode;
    try {
      console.log('레디스');
      emailCode = await this.redisService.getCluster().get(email);
      console.log('햄');
    } catch (err) {
      console.error(err);
    }
    console.log(emailCode);
    if (emailCode) {
      await this.redisService.getCluster().del(email);
    }
    console.log(2);
    await this.redisService.getCluster().set(email, code, 'EX', 60 * 60 * 3);

    await this.emailService.queueVerificationEmail(email, code);
  }

  async signUp(
    email: string,
    password: string,
    passwordConfirm: string,
    nickName: string,
    birth: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser && existingUser.emailVerified) {
      await queryRunner.release();
      throw new ConflictException(
        '이미 해당 이메일로 가입된 사용자가 있습니다!',
      );
    }

    if (password !== passwordConfirm) {
      await queryRunner.release();
      throw new UnauthorizedException(
        '비밀번호가 체크비밀번호와 일치하지 않습니다.',
      );
    }

    try {
      const hashedPassword = await hash(password, 10);

      if (existingUser) {
        await queryRunner.manager
          .getRepository(UserInfos)
          .delete(existingUser.id);
        await queryRunner.manager.getRepository(Users).delete(existingUser.id);
      }

      const user = await queryRunner.manager.getRepository(Users).save({});
      const userInfo = await queryRunner.manager.getRepository(UserInfos).save({
        email: email,
        password: hashedPassword,
        nickName: nickName,
        birth: birth,
        user: user,
      });

      await queryRunner.commitTransaction();
      console.log(1);
      await this.AuthenticationNumberCache(email);

      return userInfo;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async verifiCationEmail(verifiCation: VerifiCation) {
    console.log('verifiCationEmail', verifiCation);
    const code = await this.redisService.getCluster().get(verifiCation.email);

    const user = await this.usersService.findByEmail(verifiCation.email);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (!code) {
      throw new NotFoundException(
        '인증 코드가 만료되었거나 존재하지 않습니다.',
      );
    }

    if (code !== verifiCation.code.toString()) {
      throw new ConflictException('인증 코드가 일치하지 않습니다.');
    }

    await this.usersInfoRepository.update(user.id, { emailVerified: true });

    await this.redisService.getCluster().del(verifiCation.email);

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.usersInfoRepository.findOne({
      select: ['id', 'email', 'password', 'emailVerified'],
      where: { email: email },
    });

    if (_.isNil(user)) {
      throw new UnauthorizedException('이메일을 확인해주세요.');
    }
    if (user.emailVerified === false) {
      throw new UnauthorizedException('아직 인증이 되지 않은 회원입니다.');
    }

    if (!(await compare(password, user.password))) {
      throw new UnauthorizedException('비밀번호를 확인해주세요.');
    }

    const payload = { sub: user.id };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_KEY,
      expiresIn: 1000 * 60 * 60 * 12,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_SECRET,
      expiresIn: 1000 * 60 * 60 * 24 * 7,
    });
    const refreshTokenCacheKey = `refreshToken:${refreshToken}`;
    // const newClientId = uuidv4();
    // const clientsInfo = await this.usersService.updateClientsInfo({
    //   userId: user.id,
    //   clientId: newClientId,
    // });

    await this.redisService
      .getCluster()
      .set(refreshTokenCacheKey, refreshToken, 'EX', 60 * 60 * 24 * 7);
    return { accessToken };
  }

  async refreshToken(oldRefreshToken: string) {
    const userId = await this.redisService
      .getCluster()
      .get(`refresh_token:${oldRefreshToken}`);
    if (!userId) throw new UnauthorizedException('리프레시 토큰이 없음니다');

    const accessToken = this.jwtService.sign(
      { userId },
      { expiresIn: 1000 * 60 * 60 * 24 },
    );
    const refreshToken = this.jwtService.sign(
      { userId },
      { expiresIn: 1000 * 60 * 60 * 24 * 7 },
    );

    await this.redisService
      .getCluster()
      .del(`refresh_token:${oldRefreshToken}`);
    await this.redisService
      .getCluster()
      .set(
        `refresh_token:${refreshToken}`,
        refreshToken,
        'EX',
        60 * 60 * 24 * 7,
      );

    return { accessToken, refreshToken };
  }
}
