import { Logger, ValidationPipe, } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieparser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle("국민참여재판")
    .setDescription("국민참여재판 API Docs")
    .setVersion("1.0")
    .addTag("국민참여재판_프로젝트")
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        name: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.use(cookieparser());
  const PORT = 3000;
  await app.listen(PORT);
  Logger.log(
    `${PORT}번 포트로 서버 실행 중... API Docs: http://localhost:3000/api`,
  );
}
bootstrap();