import { Injectable } from '@nestjs/common';
import { SearchQueryDto } from './dto/search.dto';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService {
  constructor(private readonly esService: ElasticsearchService) {}

  async searchHumorBoard(searchQueryDto: SearchQueryDto) {
    const boolQuery = {
      bool: {
        should: [],
        minimum_should_match: 1,
      },
    };

    //만약 title쿼리값이 있을 경우,
    if (searchQueryDto.titleQuery) {
      boolQuery.bool.should.push({
        match: { title: searchQueryDto.titleQuery },
      });
    }
    //만약 content 쿼리값이 있을 경우,
    if (searchQueryDto.contentQuery) {
      boolQuery.bool.should.push({
        match: { content: searchQueryDto.contentQuery },
      });
    }

    const data = await this.esService.search({
      index: searchQueryDto.boardName,
      body: {
        query: boolQuery,
      },
    });

    // 검색 결과에서 문서들의 배열을 추출
    const hits = data.body.hits.hits;

    // 각 검색 결과 문서(_source)를 결과 배열에 저장
    let result = hits.map((hit) => hit._source);

    return result; // 검색 결과 반환
  }
}
