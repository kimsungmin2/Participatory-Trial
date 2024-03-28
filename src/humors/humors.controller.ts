import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import { HumorsService } from './humors.service';
import { CreateHumorBoardDto } from './dto/create-humor.dto';
import { UpdateHumorDto } from './dto/update-humor.dto';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Users } from '../users/entities/user.entity';
import { HumorBoards } from './entities/humor-board.entity';
@ApiTags('유머 게시판')
@Controller('humors')
export class HumorsController {
  constructor(private readonly humorsService: HumorsService) {}

  @ApiBody({
    description: '유머 게시물 생성',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
      },
    },
  })
  @ApiOperation({ summary: '유머 게시판 게시물 생성' })
  @Post()
  async createHumorBoard(
    @Body() createHumorBoardDto: CreateHumorBoardDto,
  ): Promise<HumorBoardReturnValue> {
    const createdBoard =
      await this.humorsService.createHumorBoard(createHumorBoardDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: '게시물 생성에 성공하였습니다.',
      data: createdBoard,
    };
  }
  @ApiBody({
    description: '모든 게시물 조회',
  })
  @ApiOperation({ summary: '모든 유머 게시물 조회' })
  @Get()
  async getAllHumorBoards(): Promise<HumorBoardReturnValue> {
    const HumorBoards: HumorBoards[] =
      await this.humorsService.getAllHumorBoards();

    return {
      statusCode: HttpStatus.OK,
      message: '게시물 조회 성공',
      data: HumorBoards,
    };
  }

  @ApiOperation({ summary: '단편 유머 게시물 조회' })
  @Get(':id')
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
      await this.humorsService.findOneHumorBoard(id);
    return {
      statusCode: HttpStatus.OK,
      message: `${id}번 게시물 조회 성공`,
      data: findHumorBoard,
    };
  }

  @Patch(':id')
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
    name: 'id',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  async updateHumorBoard(
    @Param('id') id: number,
    @Body() updateHumorDto: UpdateHumorDto,
  ): Promise<HumorBoardReturnValue> {
    const updatedHumorBoard = await this.humorsService.updateHumorBoard(
      id,
      updateHumorDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: `${id}번 게시물 업데이트 성공`,
      data: updatedHumorBoard,
    };
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  async removeHumorBoard(
    @Param('id') id: number,
  ): Promise<HumorBoardReturnValue> {
    await this.humorsService.removeHumorBoard(id);

    return {
      statusCode: HttpStatus.OK,
      message: `${id}번 게시물 삭제 성공`,
    };
  }
}
