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
import { SearchQueryDto } from './dto/search.dto';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
@ApiTags('검색')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ApiOperation({ summary: '유머게시판 검색' })
  @Get('humor-board')
  async searchHumorBoard(@Query() searchQueryDto: SearchQueryDto) {
    console.log(1);
    return await this.searchService.searchHumorBoard(searchQueryDto);
  }
}
