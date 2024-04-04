import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { setupSwagger } from './utils/swagger';
import { LoggingInterceptor } from './utils/logging.interceptor';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { winstonLogger } from './utils/winston';
import { HttpLoggingInterceptor } from './utils/http.loggin.interceptor';
import { WinstonLogger } from 'nest-winston';

async function bootstrap() {
  const logger = winstonLogger;
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.engine('ejs', require('ejs').__express);
  app.set('view engine', 'ejs');
  app.set('views', join(__dirname, '..', 'views'));
  app.useGlobalInterceptors(new HttpLoggingInterceptor());
  setupSwagger(app);
  const port = 3000;
  await app.listen(port);
  logger.verbose(`${port}번 포트에서 어플리케이션 실행`);
}
bootstrap();
