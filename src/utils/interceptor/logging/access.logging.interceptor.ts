import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { winstonLogger } from '../../winston';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor() {}
  private logger = winstonLogger;

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const now = Date.now();
    const request = httpContext.getRequest();
    const response: HumorBoardReturnValue = httpContext.getResponse();
    const clientIp = request.headers['x-forwarded-for'] || request.ip;
    const referer = request.headers['referer'] || request.headers['referrer'];
    const userAgent = request.headers['user-agent'];
    const { method, body, url } = httpContext.getRequest();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        this.logger.log(
          JSON.stringify({
            logLevel: 'info',
            timestamp: new Date().toISOString(),
            statusCode: response?.statusCode,
            method,
            url,
            duration,
            clientIp,
            body,
            data: response.data,
            referer,
            userAgent,
          }),
        );
      }),
    );
  }
}
