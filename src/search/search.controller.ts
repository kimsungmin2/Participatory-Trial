import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { CreateSearchDto } from './dto/create-search.dto';
import { UpdateSearchDto } from './dto/update-search.dto';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
@ApiTags('검색')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ApiOperation({ summary: '유머게시판 검색' })
  @ApiQuery({
    name: 'q',
    required: true,
    description: '검색어',
    type: 'string',
  })
  @Get('humor-board')
  async searchHumorBoard(@Query('q') q: string) {
    console.log(1);
    return await this.searchService.searchHumorBoard(q);
  }
}
