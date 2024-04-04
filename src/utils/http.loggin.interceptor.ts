import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { winstonLogger } from './winston';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor() {}
  private logger = winstonLogger;

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const { method, original, query, param, body, url } =
      httpContext.getRequest();
    const now = Date.now();
    return next.handle().pipe(
      tap((data) =>
        this.logger.log(
          JSON.stringify({
            request: { method, original, query, param, body, url },
            response: {
              statusCode: httpContext.getResponse()?.statusCode,
              data,
              time: Date.now() - now,
            },
          }),
        ),
      ),
    );
  }
}
