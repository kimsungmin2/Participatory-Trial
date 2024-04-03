import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';
import { HumorsService } from './humors/humors.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
}
