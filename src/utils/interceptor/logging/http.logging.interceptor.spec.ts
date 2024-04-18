import { CallHandler, ExecutionContext } from '@nestjs/common';
import { HttpLoggingInterceptor } from './http.logging.interceptor';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';

describe('HttpLoggingInterceptor', () => {
  let interceptor: HttpLoggingInterceptor;
  let executionContextMock: ExecutionContext;
  let callHandlerMock: CallHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpLoggingInterceptor],
    }).compile();

    interceptor = module.get<HttpLoggingInterceptor>(HttpLoggingInterceptor);
    executionContextMock = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: {
            'x-forwarded-for': '192.168.0.1',
            'user-agent': 'this-is-user-agent',
            referer: 'http://example.com',
          },
          method: 'GET',
          url: '/test',
          ip: '127.0.0.1',
          body: { data: 'test-data' },
        }),
        getResponse: jest.fn().mockReturnValue({
          statusCode: 200,
          data: 'response data',
        }),
      }),
    } as unknown as ExecutionContext;
    callHandlerMock = {
      handle: jest.fn().mockReturnValue(of('test')),
    };
  });

  it('should log the request', async () => {
    jest.spyOn(interceptor.logger, 'log').mockImplementation(() => {});

    const result = await interceptor.intercept(
      executionContextMock,
      callHandlerMock,
    );
    if (result instanceof Promise) {
      const observable = await result;
      await observable.toPromise();
    } else {
      await result.toPromise();
    }
    expect(interceptor.logger.log).toHaveBeenCalled();
    expect(jest.spyOn(interceptor.logger, 'log')).toHaveBeenCalledWith(
      expect.any(String),
    );
  });
});
