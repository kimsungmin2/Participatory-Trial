import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class CheckLoggedIn implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    req['isLoggedIn'] = !!req.cookies['authorization'];
    next();
  }
}
