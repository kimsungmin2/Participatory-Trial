import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { setupSwagger } from './utils/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { winstonLogger } from './utils/winston';
import { HttpExceptionFilter } from './utils/filter/exception.filter';
import { CheckLoggedIn } from './utils/middlewares/is_logged-in.mddileware';

async function bootstrap() {
  process.on('unhandledRejection', (reason, promise) => {
    console.log(reason);
    winstonLogger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    winstonLogger.error('Uncaught Exception thrown:', error);
  });
  const logger = winstonLogger;
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const cors = require('cors');

  app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.use(new CheckLoggedIn().use);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.engine('ejs', require('ejs').__express);
  app.set('view engine', 'ejs');
  app.set('views', join(__dirname, '..', 'views'));
  setupSwagger(app);
  const port = 3000;
  await app.listen(port);
  logger.verbose(`${port}번 포트에서 어플리케이션 실행`);
}
bootstrap();
