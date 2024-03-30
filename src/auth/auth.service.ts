import {
  ConflictException,
  Injectable,
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
import { Role } from '../users/types/userRole.type';
import { Users } from '../users/entities/user.entity';
import { SignUpDto } from './dto/sign.dto';
import { VerifiCation } from './dto/verification.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserInfos)
    private readonly usersInfoRepository: Repository<UserInfos>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
  ) {}

  async validateUser(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }
    return user;
  }

  async createToken(id: string) {
    const userEmail = await this.usersService.findByEmail(id);

    const payload = { userEmail };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_KEY,
      expiresIn: '12h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_SECRET,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
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
        verifiCationCode: 0,
        emailVerified: true,
        user: user,
      });

      await queryRunner.commitTransaction();
      return userInfo;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error('Database Error');
    } finally {
      await queryRunner.release();
    }
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
    if (existingUser) {
      throw new ConflictException(
        '이미 해당 이메일로 가입된 사용자가 있습니다!',
      );
    }
    if (password !== passwordConfirm) {
      throw new UnauthorizedException(
        '비밀번호가 체크비밀번호와 일치하지 않습니다.',
      );
    }
    try {
      const code = Math.floor(Math.random() * 900000) + 100000;
      await this.emailService.sendVerificationToEmail(email, code);
      const hashedPassword = await hash(password, 10);

      const user = await queryRunner.manager.getRepository(Users).save({});

      await queryRunner.manager.getRepository(UserInfos).save({
        id: user.id,
        email: email,
        password: hashedPassword,
        nickName: nickName,
        birth: birth,
        verifiCationCode: code,
        user: user,
      });

      await queryRunner.commitTransaction();
      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async verifiCationEmail(verifiCation: VerifiCation) {
    const user = await this.usersService.findByEmail(verifiCation.email);
    if (user.verifiCationCode !== verifiCation.code) {
      throw new ConflictException('인증 코드가 일치하지 않습니다.');
    }
    await this.usersInfoRepository.update(user.id, {
      emailVerified: true,
    });
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

    const payload = { email: user.email, sub: user.id };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_KEY,
      expiresIn: '12h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_SECRET,
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }
}
