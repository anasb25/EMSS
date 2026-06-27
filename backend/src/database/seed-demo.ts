import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DemoSeedService } from './demo-seed.service';

async function bootstrap() {
  const logger = new Logger('SeedDemo');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const seeder = app.get(DemoSeedService);
    await seeder.run();
    logger.log('Done.');
  } catch (error) {
    logger.error('Demo seed failed', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
