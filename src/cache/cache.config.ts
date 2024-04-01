import { CacheModuleOptions, CacheOptionsFactory } from "@nestjs/cache-manager";
import { Injectable } from "@nestjs/common";
import { redisStore } from "cache-manager-redis-yet";

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {

    createCacheOptions(): CacheModuleOptions {
        const config: CacheModuleOptions = {
            store: redisStore,
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
            ttl :60,
        };
        return config
    }
}