import 'reflect-metadata';
import app from './app';
import { config } from './config';
import { PrismaService } from './database/prisma.service';
import { logger } from './common/utils/logger';
import { startBackgroundJobs } from './workers';

async function bootstrap() {
  try {
    await PrismaService.onModuleInit();
    logger.info('Database connected successfully');

    startBackgroundJobs();

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`API Docs: http://localhost:${config.port}/api/docs`);
      logger.info(`Health: http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await PrismaService.onModuleDestroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await PrismaService.onModuleDestroy();
  process.exit(0);
});

bootstrap();
