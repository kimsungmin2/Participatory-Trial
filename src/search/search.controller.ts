import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search.dto';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SearchAllQueryDto } from './dto/searchAll.dto';
@ApiTags('검색')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ApiOperation({ summary: '게시판 검색' })
  @Get('')
  async searchHumorBoard(@Query() searchQueryDto: SearchQueryDto) {
    const data = await this.searchService.searchHumorBoard(searchQueryDto);

    return {
      statusCode: HttpStatus.OK,
      message: `${searchQueryDto.boardName}게시판 검색 완료`,
      count: data.length,
      data,
    };
  }

  @ApiOperation({ summary: '전체 검색' })
  @Get('all')
  async searchAllBoards(@Query() searchAllQueryDto: SearchAllQueryDto) {
    const data = await this.searchService.searchHumorBoard(searchAllQueryDto);

    return {
      statusCode: HttpStatus.OK,
      message: `전체 게시판 검색 완료`,
      count: data.length,
      data,
    };
  }
}
