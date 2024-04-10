import { Controller, Get, Render, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { HumorsService } from './humors/humors.service';
import { Request } from 'express';


@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    // private readonly humorService: HumorsService,
  ) {}

  @Get('')
  @Render('index.ejs') // index.ejs 파일을 렌더링하여 응답
  getIndex(@Req() req: Request): { isLoggedIn: boolean } {
    return { isLoggedIn: req['isLoggedIn'] };
  }

  @Get('vote1')
  @Render('vote1.ejs') // index.ejs 파일을 렌더링하여 응답
  getVote(@Req() req: Request) {
    return { isLoggedIn: req['isLoggedIn'], data: { title: 1, userId: 1 } };
  }
}
