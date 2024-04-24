import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-yet';

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
  createCacheOptions(): CacheModuleOptions {
    const config: CacheModuleOptions = {
      store: redisStore,
      clusterConfig: {
        nodes: [
          {
            host: process.env.REDIS_HOST_1,
            port: parseInt(process.env.REDIS_PORT_1),
          },
          {
            host: process.env.REDIS_HOST_2,
            port: parseInt(process.env.REDIS_PORT_2),
          },
          {
            host: process.env.REDIS_HOST_3,
            port: parseInt(process.env.REDIS_PORT_3),
          },
        ],
        options: {
          //   redisOptions: {
          //     password: process.env.REDIS_PASSWORD,
          //   },
        },
      },
      ttl: 60,
    };
    return config;
  }
}
