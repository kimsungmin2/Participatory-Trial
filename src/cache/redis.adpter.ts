import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisIoAdapter implements OnModuleInit, OnModuleDestroy {
  private dataClient: Redis;
  private subClient: Redis;

  constructor() {
    const redisOptions: RedisOptions = {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
    };

    this.dataClient = new Redis(redisOptions);
    this.subClient = this.dataClient.duplicate();

    this.setupErrorHandlers();
  }

  private setupErrorHandlers(): void {
    this.dataClient.on('error', (err) => {});
    this.subClient.on('error', (err) => {});
  }

  getDataClient(): Redis {
    return this.dataClient;
  }

  getSubClient(): Redis {
    return this.subClient;
  }

  async onModuleInit() {
    console.log('연결');
  }

  async onModuleDestroy() {
    await this.dataClient.quit();
    await this.subClient.quit();
  }
}
