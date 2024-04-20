import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, WebSocketAdapter } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { setupSwagger } from './utils/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { CheckLoggedIn } from './utils/middlewares/is_logged-in.mddileware';
// import { RedisIoAdapter } from './cache/redis.adpter';

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
  // const redisIoAdapter = app.get<RedisIoAdapter>(RedisIoAdapter);
  // app.useWebSocketAdapter(redisIoAdapter as unknown as WebSocketAdapter);
  app.use(new CheckLoggedIn().use);
  app.engine('ejs', require('ejs').__express);
  app.set('view engine', 'ejs');
  app.set('views', join(__dirname, '..', 'views'));
  setupSwagger(app);
  const port = 3000;
  await app.listen(port);
  logger.log(`${port}번 포트에서 어플리케이션 실행`);
}
bootstrap();
