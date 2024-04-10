import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  private serverInstance: Server;

  async connectToRedis(configService: ConfigService): Promise<void> {
    const pubClient = createClient({
      password: configService.get<string>('REDIS_PASSWORD'),
      socket: {
        host: configService.get<string>('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
      },
    });
    const subClient = pubClient.duplicate();
    const connect = await Promise.all([
      pubClient.connect(),
      subClient.connect(),
    ]).catch((err) => Logger.log('adapter 에러 확인 로그', err));
    Logger.log('connect', connect);
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    this.serverInstance = server;

    return server;
  }

  getServerInstance(): Server {
    return this.serverInstance;
  }
}
