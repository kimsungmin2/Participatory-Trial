import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { setupSwagger } from './utils/swagger';
import { LoggingInterceptor } from './utils/logging.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger();
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
  // app.useStaticAssets(join(__dirname, '..', 'views'));
  app.useGlobalInterceptors(new LoggingInterceptor());
  setupSwagger(app);
  const port = 3000;
  await app.listen(port);
  logger.log(`${port}번 포트에서 어플리케이션 실행`);
}
bootstrap();
