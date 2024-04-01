import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, map, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();

    const { url, method } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() =>
        console.log(
          `================\n` +
            `URL: ${url}\n` +
            `Method: ${method}\n` +
            `API 실행 결과: ${Date.now() - now}ms\n` +
            `================`,
        ),
      ),

      map((responseData) => responseData),
    );
  }
}
