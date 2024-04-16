import { Injectable, Query } from '@nestjs/common';
import { CreateSearchDto } from './dto/create-search.dto';
import { UpdateSearchDto } from './dto/update-search.dto';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService {
  constructor(private readonly esService: ElasticsearchService) {}

  async searchHumorBoard(q: string) {
    const data = await this.esService.search({
      index: 'humor_boards', // 검색할 인덱스 지정
      body : {
        
      }
    });
    console.log(data);

    // 검색 결과에서 문서들의 배열을 추출
    const hits = data.body.hits.hits;

    // 각 검색 결과 문서(_source)를 결과 배열에 저장
    let result = hits.map((hit) => hit._source);

    return result; // 검색 결과 반환
  }

  async createIndex(): Promise<void>{
    
  }
  async indexCaseData(caseData: any){
    return await this.esService.index({
      index: 'law_case',
      body: caseData
    })
  }
}
