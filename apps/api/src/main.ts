import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: [process.env.WEB_BASE_URL || 'http://localhost:3000'],
      credentials: true,
    },
  });

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Karen Legal Suite API')
    .setDescription('Practice management + legal AI API')
    .setVersion('1.0.0')
    .addCookieAuth('session_token')
    .addSecurity('x-session-token', {
      type: 'apiKey',
      in: 'header',
      name: 'x-session-token',
    })
    .build();

  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('openapi', app, doc);

  const prisma = app.get(PrismaService);
  await prisma.enableShutdownHooks(app);

  const port = Number(process.env.API_PORT || 4000);
  await app.listen(port);
}

bootstrap();
