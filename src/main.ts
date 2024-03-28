import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
<<<<<<< HEAD
import cookieParser from 'cookie-parser';
=======
import * as cookieParser from 'cookie-parser';
>>>>>>> 0fc3bbb63a912874ef8de546ec0ba4049e493ace
import { setupSwagger } from './utils/swagger';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
<<<<<<< HEAD
=======

>>>>>>> 0fc3bbb63a912874ef8de546ec0ba4049e493ace
  setupSwagger(app);
  const port = 3000;
  await app.listen(port);
  logger.log(`${port}번 포트에서 어플리케이션 실행`);
}
bootstrap();
