import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';
import { HumorsService } from './humors/humors.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly humorService: HumorsService,
  ) {}

  @Get('')
  @Render('index.ejs') // index.ejs 파일을 렌더링하여 응답
  @Get('online-boards')
  @Render('board.ejs') // index.ejs 파일을 렌더링하여 응답
  async getOnlineBoard() {
    const PaginationQueryDto = {
      limit: 10,
      page: 1,
    };
    const humorBoard =
      await this.humorService.getAllHumorBoards(PaginationQueryDto);
    console.log(humorBoard);
    return { data: humorBoard };
  }

  @Get('online-boards')
  @Render('board.ejs') // index.ejs 파일을 렌더링하여 응답
  async getTrialBoard() {
    const PaginationQueryDto = {
      limit: 10,
      page: 1,
    };
    const humorBoard =
      await this.humorService.getAllHumorBoards(PaginationQueryDto);
    return { data: humorBoard, boardType: 'online' };
  }

  @Get('online-boards')
  @Render('online-board.ejs') // index.ejs 파일을 렌더링하여 응답
  async getPdBoard() {
    const PaginationQueryDto = {
      limit: 10,
      page: 1,
    };
    const humorBoard =
      await this.humorService.getAllHumorBoards(PaginationQueryDto);
    console.log(humorBoard);
    return { data: humorBoard };
  }
}
