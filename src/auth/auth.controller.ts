import {
  Controller,
  Get,
  UseGuards,
  Res,
  Req,
  HttpStatus,
  Post,
  Render,
  Body,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { KakaoAuthGuard } from '../users/utils/guard/kakao.guard';
import { NaverAuthGuard } from '../users/utils/guard/naver.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SignUpDto } from './dto/sign.dto';
import { VerifiCation } from './dto/verification.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('로그인, 회원가입')
@Controller('oauth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '회원가입' })
  @Post('sign-up')
  async register(@Body() signUpdto: SignUpDto) {
    const user = await this.authService.signUp(signUpdto);
    return user;
  }

  @ApiOperation({ summary: '회원가입 이메일 인증' })
  @Patch('signup/verifiCation')
  async verifiCationEmail(@Body() verifiCation: VerifiCation) {
    const user = await this.authService.verifiCationEmail(verifiCation);
    return user;
  }

  @ApiOperation({ summary: '운영자 회원가입' })
  @Post('admin/sign-up')
  async adminSignUp(@Body() signUpdto: SignUpDto) {
    const user = await this.authService.adminSignUp(signUpdto);
    return user;
  }

  @ApiOperation({ summary: '로그인' })
  @Post('login')
  @Render('sign-in')
  async login(@Body() loginDto: LoginDto, @Res() res) {
    const user = await this.authService.login(loginDto);

    res.cookie('authorization', `Bearer ${user.accessToken}`);
    res.cookie('refreshToken', user.refreshToken);
    res.send('로그인에 성공하였습니다.');
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
    const refreshToken = req.user.refreshToken;

    res.cookie('authorization', `Bearer ${accessToken}`);
    res.cookie('refreshToken', refreshToken);
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
    console.log(req.user.accessToken);
    const accessToken = req.user.accessToken;
    const refreshToken = req.user.refreshToken;

    res.cookie('authorization', `Bearer ${accessToken}`);
    res.cookie('refreshToken', refreshToken);
    res.redirect('/');
  }
}