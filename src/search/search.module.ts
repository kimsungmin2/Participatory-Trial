import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        node: configService.get<string>('ELASTIC_NODE'),
        auth: {
          username: 'elastic',
          password: 'tpcGoMVjOa7NpCqv2UUdlOgT',
        },
        maxRetries: 10,
        requestTimeout: 6000,
        pingTimeout: 6000,
        // sniffOnStart: true,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
