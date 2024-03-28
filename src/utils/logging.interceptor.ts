import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    console.log(`Before... ${Date.now() - now}ms`);

    return next.handle().pipe(
      tap(() => console.log(`After... ${Date.now() - now}ms`)),

      map((responseData) => responseData),
    );
  }
}
