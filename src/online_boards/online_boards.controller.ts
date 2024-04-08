import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  Query,
  Render,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { OnlineBoardsService } from './online_boards.service';
import { CreateOnlineBoardDto } from './dto/create-online_board.dto';
import { UpdateOnlineBoardDto } from './dto/update-online_board.dto';
import { FindAllOnlineBoardDto } from './dto/findAll-online_board.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from '../utils/decorator/userInfo.decorator';
import { UserInfos } from '../users/entities/user-info.entity';
import { BoardOwnerGuard } from './guards/online_boards.guard';
import { PaginationQueryDto } from '../humors/dto/get-humorBoard.dto';
import { BoardType } from '../s3/board-type';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('online-boards')
export class OnlineBoardsController {
  constructor(private readonly onlineBoardsService: OnlineBoardsService) {}

  //글쓰기 페이지
  @UseGuards(AuthGuard('jwt'))
  @Get('create')
  @Render('create-post.ejs') // index.ejs 파일을 렌더링하여 응답
  async getCreatePostPage() {
    return { boardType: BoardType.OnlineBoard };
  }
  //게시글 생성
  @UseInterceptors(FilesInterceptor('files'))
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Body() createOnlineBoardDto: CreateOnlineBoardDto,
    @UserInfo() userInfo: UserInfos,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const board = await this.onlineBoardsService.createBoard(
      createOnlineBoardDto,
      userInfo,
      files,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '게시글을 생성했습니다.',
      data: board,
    };
  }
  //전체조회
  @Get('')
  @Render('board.ejs')
  async paginateBoards(
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<HumorBoardReturnValue> {
    const { onlineBoards, totalItems } =
      await this.onlineBoardsService.getPaginateBoards(paginationQueryDto);
    const pageCount = Math.ceil(totalItems / paginationQueryDto.limit);
    console.log(pageCount);
    return {
      statusCode: HttpStatus.FOUND,
      message: '게시글을 조회합니다.',
      data: onlineBoards,
      boardType: BoardType.OnlineBoard,
      pageCount,
      currentPage: paginationQueryDto.page,
    };
  }
  //검색 API
  @Get('search')
  async findAll(@Body() findAllOnlineBoardDto: FindAllOnlineBoardDto) {
    const boards = await this.onlineBoardsService.findAllBoard(
      findAllOnlineBoardDto,
    );

    return {
      statusCode: HttpStatus.FOUND,
      message: '게시글을 조회합니다.',
      data: boards,
    };
  }
  //단건조회
  @Get(':id')
  @Render('post.ejs')
  async findOne(@Param('id') id: number) {
    const board =
      await this.onlineBoardsService.findOneOnlineBoardWithIncreaseView(id);
    return {
      statusCode: HttpStatus.OK,
      message: '게시글을 조회합니다.',
      data: board,
      boardType: BoardType.OnlineBoard,
    };
  }
  @UseGuards(AuthGuard('jwt'))
  @UseGuards(BoardOwnerGuard)
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateOnlineBoardDto: UpdateOnlineBoardDto,
  ) {
    const board = await this.onlineBoardsService.updateBoard(
      id,
      updateOnlineBoardDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '게시글을 수정했습니다.',
      data: board,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @UseGuards(BoardOwnerGuard)
  @Delete(':id')
  async remove(@Param('id') id: number) {
    const board = await this.onlineBoardsService.removeBoard(id);

    return {
      statusCode: HttpStatus.OK,
      message: '게시글을 삭제했습니다.',
      data: board,
    };
  }
}
