import { PrismaClient } from '@prisma/client';
import { config } from '../config';

export class PrismaService {
  private static instance: PrismaClient;

  private constructor() {}

  static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        log: config.nodeEnv === 'development' ? ['query', 'warn', 'error'] : ['error'],
      });
    }
    return PrismaService.instance;
  }

  static async onModuleInit(): Promise<void> {
    await PrismaService.getInstance().$connect();
  }

  static async onModuleDestroy(): Promise<void> {
    await PrismaService.getInstance().$disconnect();
  }
}
