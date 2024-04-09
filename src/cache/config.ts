import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from 'socket.io-redis';

export class RedisIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);

    // Redis 서버의 URI 문자열을 사용합니다.
    const redisUri = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
    const redisAdapter = createAdapter(redisUri);

    server.adapter(redisAdapter);
    return server;
  }
}
