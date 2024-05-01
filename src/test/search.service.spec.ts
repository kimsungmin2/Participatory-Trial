import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from '../search/search.service';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchAllQueryDto } from '../search/dto/searchAll.dto';

describe('SearchService', () => {
  let service: SearchService;
  let esService: ElasticsearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: ElasticsearchService,
          useValue: {
            search: jest.fn().mockResolvedValue({
              body: {
                hits: {
                  total: { value: 10 },
                  hits: [
                    { _source: { title: 'Example', content: 'Content here' } },
                    // 다른 검색 결과 추가 가능
                  ],
                },
              },
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    esService = module.get<ElasticsearchService>(ElasticsearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(esService).toBeDefined();
  });

  describe('searchHumorBoard', () => {
    const mockPaginateQuery = {
      page: 1,
      pageSize: 10,
    };
    it('must be success', async () => {
      const searchQueryDto = {
        boardName: 'humor',
        type: 'content',
        search: '냠냠',
      };
      const spy = jest.spyOn(esService, 'search');
      const result = await service.searchBoard(
        searchQueryDto,
        mockPaginateQuery,
      );
      expect(spy).toHaveBeenCalled();
      expect(result.result[0]).toEqual({
        title: 'Example',
        content: 'Content here',
      });
    });
  });

  describe('searchHumorBoard', () => {
    const mockPaginateQuery = {
      page: 1,
      pageSize: 10,
    };
    it('must be success', async () => {
      const searchQueryDto = {
        boardName: 'humor',
        type: 'content',
        search: '냠냠',
      };
      const spy = jest.spyOn(esService, 'search');
      const result = await service.searchBoard(
        searchQueryDto,
        mockPaginateQuery,
      );
      expect(spy).toHaveBeenCalled();
      expect(result.result[0]).toEqual({
        title: 'Example',
        content: 'Content here',
      });
    });
  });

  describe('searchAllBoards', () => {
    const mockPaginateQuery = {
      page: 1,
      pageSize: 10,
    };
    it('must be success', async () => {
      const searchQueryDto = {
        search: '냠냠',
        type: 'titleContent',
      } as SearchAllQueryDto;
      const spy = jest.spyOn(esService, 'search');
      const result = await service.searchAllBoards(
        searchQueryDto,
        mockPaginateQuery,
      );
      expect(spy).toHaveBeenCalled();
      expect(result.result[0]).toEqual({
        title: 'Example',
        content: 'Content here',
      });
    });
  });
  describe('searchBoard with titleContent', () => {
    it('should query both title and content fields', async () => {
      const searchQueryDto = {
        boardName: 'humors',
        type: 'titleContent',
        search: 'Example',
      };
      const paginateQueryDto = {
        page: 1,
        pageSize: 5,
      };

      const spy = jest.spyOn(esService, 'search');
      await service.searchBoard(searchQueryDto, paginateQueryDto);

      // 검증: Elasticsearch 쿼리가 제목과 내용 모두를 검색하는지 확인
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'humors',
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                should: expect.arrayContaining([
                  expect.objectContaining({ match: { title: 'Example' } }),
                  expect.objectContaining({ match: { content: 'Example' } }),
                ]),
              }),
            }),
          }),
        }),
      );

      // 결과 반환 확인
      const result = await service.searchBoard(
        searchQueryDto,
        paginateQueryDto,
      );
      expect(result.totalHits).toEqual(10);
      expect(result.result[0]).toEqual({
        title: 'Example',
        content: 'Content here',
      });
    });
  });
});
