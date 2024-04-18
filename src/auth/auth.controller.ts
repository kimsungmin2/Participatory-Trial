import {
  Controller,
  Get,
  UseGuards,
  Res,
  Req,
  HttpStatus,
  Post,
  Body,
  Patch,
  Render,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { KakaoAuthGuard } from '../utils/guard/kakao.guard';
import { NaverAuthGuard } from '../utils/guard/naver.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SignUpDto } from './dto/sign.dto';
import { VerifiCation } from './dto/verification.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthGuard } from '../utils/guard/google.guard';

@ApiTags('로그인, 회원가입')
@Controller('')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '회원가입' })
  @Post('sign-up')
  async register(@Body() signUpdto: SignUpDto) {
    console.log(signUpdto);
    const user = await this.authService.signUp(
      signUpdto.email,
      signUpdto.password,
      signUpdto.passwordConfirm,
      signUpdto.nickName,
      signUpdto.birth,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: '회원 가입에 성공하였습니다',
      user,
    };
  }

  @ApiOperation({ summary: '회원가입 이메일 인증' })
  @Patch('sign-up/verification')
  async verifiCationEmail(@Body() verifiCation: VerifiCation) {
    const user = await this.authService.verifiCationEmail(verifiCation);
    return {
      statusCode: HttpStatus.OK,
      message: '인증에 성공하였습니다.',
      user,
    };
  }

  @ApiOperation({ summary: '로그인' })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res) {
    const user = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    res.cookie('authorization', `Bearer ${user.accessToken}`, {
      maxAge: 1000 * 60 * 60 * 12,
      httpOnly: true,
      secure: true,
    });
    res.send('로그인에 성공하였습니다.');
    // res.redirect('/online-board');
  }

  // @ApiOperation({ summary: '유저 정보' })
  // @UseGuards(JwtAuthGuard)
  // @Get('')
  // @Render('users')
  // getUser(@UserInfo() user: Users) {
  //   return { 이름: user.name, 자기소개: user.Introduce };
  // }

  @ApiOperation({ summary: '로그아웃', description: '로그아웃' })
  @Post('logout')
  logOut(@Res() res) {
    res.clearCookie('authorization');
    res.clearCookie('refreshToken');
    res.send('로그아웃에 성공하였습니다.');
  }

  @ApiOperation({
    summary: '카카오 로그인',
    description: '카카오 계정으로 로그인 하세요.',
  })
  @UseGuards(KakaoAuthGuard)
  @Get('kakao')
  redirectToKakaoAuth(@Res() res) {
    const KAKAO_REST_API_KEY = process.env.KAKAO_CLIENT_ID;
    const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;
    const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_REST_API_KEY}&redirect_uri=${KAKAO_REDIRECT_URI}`;

    res.redirect(HttpStatus.TEMPORARY_REDIRECT, kakaoAuthURL);
  }

  @UseGuards(KakaoAuthGuard)
  @Get('kakao/callback')
  async kakaoCallbacks(@Req() req, @Res() res) {
    const accessToken = req.user.accessToken;

    res.cookie('authorization', `Bearer ${accessToken}`, {
      maxAge: 1000 * 60 * 60 * 12,
      httpOnly: true,
      secure: true,
    });
    res.redirect('/');
  }

  @UseGuards(NaverAuthGuard)
  @Get('/naver')
  redirectToNaverAuth(@Res() res) {
    const NAVER_REST_API_KEY = process.env.NAVER_CLIENT_ID;
    const NAVER_REDIRECT_URI = process.env.NAVER_REDIRECT_URI;
    const naverURL = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_REST_API_KEY}&redirect_uri=${NAVER_REDIRECT_URI}&state=hLiDdL2uhPtsftcU`;

    res.redirect(HttpStatus.TEMPORARY_REDIRECT, naverURL);
  }

  @UseGuards(NaverAuthGuard)
  @Get('/naver/callback')
  async naverCallbacks(@Req() req, @Res() res) {
    const accessToken = req.user.accessToken;

    res.cookie('authorization', `Bearer ${accessToken}`, {
      maxAge: 1000 * 60 * 60 * 12,
      httpOnly: true,
      secure: true,
    });
    res.redirect('/');
  }

  @UseGuards(GoogleAuthGuard)
  @Get('/google')
  redirectToGoogleAuth(@Res() res) {
    const googleURL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=email%20profile`;

    res.redirect(HttpStatus.TEMPORARY_REDIRECT, googleURL);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('/google/callback')
  async googleCallbacks(@Req() req, @Res() res) {
    const accessToken = req.user.accessToken;

    res.cookie('authorization', `Bearer ${accessToken}`, {
      maxAge: 1000 * 60 * 60 * 12,
      httpOnly: true,
      secure: true,
    });
    res.redirect('/');
  }

  // 회원가입 페이지로 이동
  @Get('sign-up')
  @Render('sign-up.ejs')
  async getSignUp() {
    return {};
  }

  @Get('verification')
  @Render('email-validation-check.ejs')
  async getVerifyEmail() {
    return {};
  }

  @Get('sign-in')
  @Render('sign-in.ejs')
  async getSignIn() {
    return {};
  }
}
