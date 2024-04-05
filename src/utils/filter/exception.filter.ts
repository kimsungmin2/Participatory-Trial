import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { winstonLogger } from '../winston';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor() {}
  private logger = winstonLogger;
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const request = ctx.getRequest();
    const referer = request.headers['referer'] || request.headers['referrer'];
    const userAgent = request.headers['user-agent'];
    const clientIp = request.headers['x-forwarded-for'] || request.ip;

    // 에러 메시지 추출 로직 개선
    let errorMessage: string;
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const message = exceptionResponse.message;
      if (typeof message === 'string') {
        // message가 string인 경우, 안전하게 할당
        errorMessage = message;
      } else if (Array.isArray(message)) {
        // message가 문자열 배열인 경우, 배열을 문자열로 변환
        errorMessage = message.join(', ');
      } else {
        // 기타 경우, 기본 에러 메시지 사용
        errorMessage = 'An unknown error occurred';
      }
    } else if (typeof exceptionResponse === 'string') {
      // exceptionResponse가 직접적으로 string인 경우
      errorMessage = exceptionResponse;
    } else {
      // 모든 다른 경우, 기본 에러 메시지 사용
      errorMessage = 'An unknown error occurred';
    }

    // 향상된 로깅 메커니즘
    this.logger.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        clientIp,
        status,
        referer,
        userAgent,
        message: errorMessage,
        path: request.url,
        method: request.method,
        ...(request.method !== 'GET' && {
          body: request.body,
          query: request.query,
          params: request.params,
          headers: request.headers,
        }),
      }),
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errorMessage,
    });
  }
}
