import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { ElasticsearchService } from '@nestjs/elasticsearch';

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
    it('must be success', async () => {
      const searchQueryDto = {
        boardName: 'humor',
        titleQuery: 'funny',
        contentQuery: 'joke',
      };
      const spy = jest.spyOn(esService, 'search');
      const result = await service.searchHumorBoard(searchQueryDto);
      expect(spy).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ title: 'Example', content: 'Content here' });
    });
  });

  describe('searchAllBoards', () => {
    it('must be success', async () => {
      const searchQueryDto = {
        titleQuery: 'funny',
        contentQuery: 'joke',
      };
      const spy = jest.spyOn(esService, 'search');
      const result = await service.searchAllBoards(searchQueryDto);
      expect(spy).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ title: 'Example', content: 'Content here' });
    });
  });
});
