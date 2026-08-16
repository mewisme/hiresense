import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  const port = config.getOrThrow<number>('app.port');
  const environment = config.getOrThrow<string>('app.environment');

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(port);

  console.log(
    `HireSense API running on http://localhost:${port}/api [${environment}]`,
  );
}

void bootstrap();