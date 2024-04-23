import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
//useFactory : 모듈 설정을 동적으로 생성하는 팩토리 함수
/**
 * node : es 노드 주소 ex) http://localhost:9200
 * maxRetries : 실패시 재시도할 최대 횟수
 * requestTimeout : 최대 요청시간(밀리초 단위)
 * pingTimeout : 최대 대기 시간(밀리초 단위)
 * sniffOnStart : 스니핑 활성화
 */
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
