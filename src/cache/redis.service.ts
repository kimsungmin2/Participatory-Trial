import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as Redis from 'ioredis';
@Injectable()
export class RedisService implements OnModuleDestroy {
  private cluster: Redis.Cluster;
  constructor() {
    this.cluster = new Redis.Cluster(
      [
        {
          host: process.env.REDIS_HOST_1,
          port: parseInt(process.env.REDIS_PORT_1, 10),
        },
        {
          host: process.env.REDIS_HOST_2,
          port: parseInt(process.env.REDIS_PORT_2, 10),
        },
        {
          host: process.env.REDIS_HOST_3,
          port: parseInt(process.env.REDIS_PORT_3, 10),
        },
      ],
      {
        natMap: {
          '172.20.0.2:6380': {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT_1),
          },
          '172.20.0.3:6381': {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT_2),
          },
          '172.20.0.4:6382': {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT_3),
          },
          '172.20.0.5:6383': {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT_4),
          },
          '172.20.0.6:6384': {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT_5),
          },
          '172.20.0.7:6385': {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT_6),
          },
        },
        scaleReads: 'slave',
      },
    );
  }
  getCluster(): Redis.Cluster {
    return this.cluster;
  }
  async onModuleDestroy(): Promise<void> {
    this.cluster.disconnect();
  }
}
