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

    let errorMessage: string;
    if (
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const message = exceptionResponse.message;
      if (typeof message === 'string') {
        errorMessage = message;
      }
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
