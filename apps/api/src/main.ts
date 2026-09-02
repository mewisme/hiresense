import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  const port = config.getOrThrow<number>('app.port');
  const environment = config.getOrThrow<string>('app.environment');

  configureApp(app);

  await app.listen(port);

  Logger.log(
    `HireSense API running on http://localhost:${port}/api [${environment}]`,
  );
}

void bootstrap();