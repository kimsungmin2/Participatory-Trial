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
@ApiTags('검색')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ApiOperation({ summary: '게시판 검색' })
  @Get('')
  @Render('search.ejs')
  async searchHumorBoard(
    @Query() searchQueryDto: SearchQueryDto,
    @Query() //페이지네이션 용 쿼리 필요함
    @Req()
    req: Request,
  ) {
    const { totalHits, result } =
      await this.searchService.searchBoard(searchQueryDto);

    return {
      statusCode: HttpStatus.OK,
      message: `${searchQueryDto.boardName}게시판 검색 완료`,
      count: result.length,
      data: result,
      boardType: searchQueryDto.boardName,
      isLoggedIn: req['isLoggedIn'],
    };
  }

  @ApiOperation({ summary: '전체 검색' })
  @Get('all')
  @Render('searchAll.ejs')
  async searchAllBoards(
    @Query() searchAllQueryDto: SearchAllQueryDto,
    @Req() req: Request,
  ) {
    const data = await this.searchService.searchAllBoards(searchAllQueryDto);

    return {
      statusCode: HttpStatus.OK,
      message: `전체 게시판 검색 완료`,
      count: data.length,
      data,
      isLoggedIn: req['isLoggedIn'],
      boardType: null,
    };
  }
}
