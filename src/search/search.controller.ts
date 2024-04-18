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
  Render,
  Req,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search.dto';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SearchAllQueryDto } from './dto/searchAll.dto';
import { PaginateQueryDto } from './dto/paginateQuery.dto';
@ApiTags('검색')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ApiOperation({ summary: '게시판 검색' })
  @Get('')
  @Render('search.ejs')
  async searchHumorBoard(
    @Query() searchQueryDto: SearchQueryDto,
    @Query() paginateQueryDto: PaginateQueryDto,
    @Req()
    req: Request,
  ) {
    const { totalHits, result } = await this.searchService.searchBoard(
      searchQueryDto,
      paginateQueryDto,
    );
    const pageCount = Math.ceil(totalHits / paginateQueryDto.pageSize);
    const currentPage = paginateQueryDto.page;
    const startPage = Math.floor((currentPage - 1) / 10) * 10 + 1;
    let endPage = startPage + 9;
    if (endPage > pageCount) {
      endPage = pageCount;
    }

    return {
      statusCode: HttpStatus.OK,
      message: `${searchQueryDto.boardName}게시판 검색 완료`,
      data: result,
      boardType: searchQueryDto.boardName,
      pageCount,
      currentPage,
      startPage,
      endPage,
      isLoggedIn: req['isLoggedIn'],
      searchWord: searchQueryDto.search,
      searchType: searchQueryDto.type,
      totalHits,
    };
  }

  @ApiOperation({ summary: '전체 검색' })
  @Get('all')
  @Render('search-all.ejs')
  async searchAllBoards(
    @Query() searchAllQueryDto: SearchAllQueryDto,
    @Query() paginateQueryDto: PaginateQueryDto,
    @Req() req: Request,
  ) {
    const { totalHits, result } = await this.searchService.searchAllBoards(
      searchAllQueryDto,
      paginateQueryDto,
    );
    const pageCount = Math.ceil(totalHits / paginateQueryDto.pageSize);
    const currentPage = paginateQueryDto.page;
    const startPage = Math.floor((currentPage - 1) / 10) * 10 + 1;
    let endPage = startPage + 9;
    if (endPage > pageCount) {
      endPage = pageCount;
    }

    return {
      statusCode: HttpStatus.OK,
      message: `전체 게시판 검색 완료`,
      count: totalHits,
      data: result,
      isLoggedIn: req['isLoggedIn'],
      searchWord: searchAllQueryDto.search,
      boardType: null,
      pageCount,
      currentPage,
      startPage,
      endPage,
      totalHits,
    };
  }
}
