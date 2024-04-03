import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
  Render,
} from '@nestjs/common';
import { HumorsService } from './humors.service';
import { CreateHumorBoardDto } from './dto/create-humor.dto';
import { UpdateHumorDto } from './dto/update-humor.dto';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Users } from '../users/entities/user.entity';
import { HumorBoards } from './entities/humor-board.entity';
import { UserInfo } from '../utils/decorator/userInfo.decorator';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PaginationQueryDto } from './dto/get-humorBoard.dto';
import { BoardType } from '../s3/board-type';
import { LikeService } from '../like/like.service';
import { LikeInputDto } from '../like/dto/create-like.dto';
@ApiTags('유머 게시판')
@Controller('humors')
export class HumorsController {
  constructor(
    private readonly humorsService: HumorsService,
    private readonly likeService: LikeService,
  ) {}

  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '유머 게시판 게시물 생성' })
  @ApiBody({
    description: '유머 게시물 생성',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        files: {
          type: 'array',
          items: {
            format: 'binary',
            type: 'string',
          },
        },
      },
    },
  })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createHumorBoard(
    @Body() createHumorBoardDto: CreateHumorBoardDto,
    @UserInfo() user: Users,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<HumorBoardReturnValue> {
    const createdBoard = await this.humorsService.createHumorBoard(
      createHumorBoardDto,
      user,
      files,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '게시물 생성에 성공하였습니다.',
      data: createdBoard,
    };
  }

  @ApiOperation({ summary: '모든 유머 게시물 조회' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '한 페이지당 게시물 수',
    type: Number,
    example: 10,
  })
  @Get()
  async getAllHumorBoards(
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<HumorBoardReturnValue> {
    const HumorBoards: HumorBoards[] =
      await this.humorsService.getAllHumorBoards(paginationQueryDto);

    return {
      statusCode: HttpStatus.OK,
      message: '게시물 조회 성공',
      data: HumorBoards,
    };
  }

  @ApiOperation({ summary: '단편 유머 게시물 조회' })
  @Get('humor-board-id/:id')
  @Render('vote.ejs')
  @ApiParam({
    name: 'id',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  async findOneHumorBoard(
    @Param('id') id: number,
  ): Promise<HumorBoardReturnValue> {
    const findHumorBoard: HumorBoards =
      await this.humorsService.findOneHumorBoardWithIncreaseView(id);
    return {
      statusCode: HttpStatus.OK,
      message: `${id}번 게시물 조회 성공`,
      data: findHumorBoard,
    };
  }
  @ApiOperation({ summary: '유머 게시물 수정' })
  @UseGuards(AuthGuard('jwt'))
  @Patch('humor-board-id/:humorBoardId')
  @ApiBody({
    description: '유머 게시물 수정',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
      },
    },
  })
  @ApiParam({
    name: 'humorBoardId',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  async updateHumorBoard(
    @Param('humorBoardId') humorBoardId: number,
    @Body() updateHumorDto: UpdateHumorDto,
    @UserInfo() user: Users,
  ): Promise<HumorBoardReturnValue> {
    const updatedHumorBoard = await this.humorsService.updateHumorBoard(
      humorBoardId,
      updateHumorDto,
      user,
    );
    return {
      statusCode: HttpStatus.OK,
      message: `${humorBoardId}번 게시물 업데이트 성공`,
      data: updatedHumorBoard,
    };
  }
  @ApiOperation({ summary: '유머 게시물 삭제' })
  @Delete('humor-board-id/:humorBoardId')
  @ApiParam({
    name: 'humorBoardId',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  async removeHumorBoard(
    @Param('humorBoardId') humorBoardId: number,
    @UserInfo() user: Users,
  ): Promise<HumorBoardReturnValue> {
    await this.humorsService.deleteHumorBoard(humorBoardId, user);

    return {
      statusCode: HttpStatus.OK,
      message: `${humorBoardId}번 게시물 삭제 성공`,
    };
  }
  //humors/25/like
  @ApiOperation({ summary: '유머 게시판 좋아요/좋아요 취소' })
  @ApiBody({
    description: '좋아요/좋아요 취소',
    schema: {
      type: 'object',
      properties: {
        boardType: { type: 'string' },
      },
    },
  })
  @ApiParam({
    name: 'humorBoardId',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  @Post('/humor-board-id/:humorBoardId/like')
  async like(
    @Param('humorBoardId') humorBoardId: number,
    @UserInfo() user: Users,
    @Body() likeInputDto: LikeInputDto,
  ): Promise<HumorBoardReturnValue> {
    const result = await this.likeService.like(
      likeInputDto,
      user,
      humorBoardId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: result,
    };
  }
}
