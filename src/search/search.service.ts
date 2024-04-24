import { BadRequestException, Injectable } from '@nestjs/common';
import { SearchQueryDto } from './dto/search.dto';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { BoardIndex } from './type/board_index.type';
import { SearchAllQueryDto } from './dto/searchAll.dto';
import { SearchType } from './type/search.type';
import { PaginateQueryDto } from './dto/paginateQuery.dto';

@Injectable()
export class SearchService {
  constructor(private readonly esService: ElasticsearchService) {}

  async searchBoard(
    searchQueryDto: SearchQueryDto,
    paginateQueryDto: PaginateQueryDto,
  ) {
    const { page, pageSize } = paginateQueryDto;
    const boolQuery = {
      bool: {
        should: [],
        minimum_should_match: '50%',
      },
    };

    switch (searchQueryDto.type) {
      case SearchType.title:
        boolQuery.bool.should.push({
          match: { title: searchQueryDto.search },
        });
        break;
      case SearchType.content:
        boolQuery.bool.should.push({
          match: { content: searchQueryDto.search },
        });
        break;
      case SearchType.titleContent:
        boolQuery.bool.should.push(
          { match: { title: searchQueryDto.search } },
          { match: { content: searchQueryDto.search } },
        );
        break;
      default:
        throw new BadRequestException(
          `${searchQueryDto.type}은 현재 지원되지 않습니다.`,
        );
    }

    const from = (page - 1) * pageSize;

    const data = await this.esService.search({
      index: searchQueryDto.boardName,
      body: {
        query: boolQuery,
        sort: [
          {
            updated_at: {
              order: 'desc',
            },
          },
        ],
        size: pageSize,
        from: from,
      },
    });
    const totalHits = data.body.hits.total.value;
    console.log(data.body.hits);

    // 검색 결과에서 문서들의 배열을 추출
    const hits = data.body.hits.hits;

    // 각 검색 결과 문서(_source)를 결과 배열에 저장
    let result = hits.map((hit) => hit._source);

    return { result, totalHits }; // 검색 결과 반환
  }

  async searchAllBoards(
    searchAllQueryDto: SearchAllQueryDto,
    paginateQueryDto: PaginateQueryDto,
  ) {
    const { page, pageSize } = paginateQueryDto;
    const boolQuery = {
      bool: {
        should: [],
        minimum_should_match: 1,
      },
    };

    boolQuery.bool.should.push(
      { match: { title: searchAllQueryDto.search } },
      { match: { content: searchAllQueryDto.search } },
    );

    const from = (page - 1) * pageSize;

    const data = await this.esService.search({
      index: [
        BoardIndex.humor,
        BoardIndex.onlineBoard,
        BoardIndex.polticalDebate,
        BoardIndex.trial,
      ].join(','),
      body: {
        query: boolQuery,
        sort: [
          {
            updated_at: {
              order: 'desc',
            },
          },
        ],
        size: pageSize,
        from: from,
      },
    });
    const totalHits = data.body.hits.total.value;

    const hits = data.body.hits.hits;

    let result = hits.map((hit) => hit._source);

    return { result, totalHits };
  }
}
