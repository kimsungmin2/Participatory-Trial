import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Render,
  Req,
} from '@nestjs/common';
import { AppService } from './app.service';
import { HumorsService } from './humors/humors.service';
import { Request } from 'express';
import { TrialsService } from './trials/trials.service';
import { PolticalDebatesService } from './poltical_debates/poltical_debates.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly trialsService: TrialsService,
    private readonly humorsService: HumorsService,
    private readonly politicalService: PolticalDebatesService,
    // private readonly humorS ervice: HumorsService,
  ) {}

  // @Get('')
  // @Render('index.ejs')
  // getIndex(@Req() req: Request): { isLoggedIn: boolean } {
  //   return { isLoggedIn: req['isLoggedIn'] };
  // }

  @Get('')
  @Render('index.ejs')
  async getTop10VotesByType(@Req() req: Request) {
    const data = await this.trialsService.findTop10TrialsByVotes();

    return {
      statusCode: HttpStatus.OK,
      message: '실시간핫한투표수데이터입니다.',
      data,
      isLoggedIn: req['isLoggedIn'],
    };
  }

  @Get('getData')
  async getData(@Req() req: Request, @Query('type') type: string) {
    let data;
    switch (type) {
      case 'option1':
        data = await this.trialsService.findTop10TrialsByVotes();
        break;
      case 'option2':
        data = await this.humorsService.findTop10VotedHumorPosts();
        break;
      case 'option3':
        data = await this.politicalService.findTop10PolticalByVotes();
        break;
    }

    return {
      statusCode: HttpStatus.OK,
      message: '실시간 핫 투표 입니다.',
      data,
      isLoggedIn: req['isLoggedIn'],
    };
  }

  @Get('vote1')
  @Render('vote1.ejs') // index.ejs 파일을 렌더링하여 응답
  getVote(@Req() req: Request) {
    return { isLoggedIn: req['isLoggedIn'], data: { title: 1, userId: 1 } };
  }
}
