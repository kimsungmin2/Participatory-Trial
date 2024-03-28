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
import { PolticalDebatesService } from './poltical_debates.service';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';
import { UpdatePolticalDebateDto } from './dto/update-poltical_debate.dto';

@Controller('poltical_debates')
export class PolticalDebatesController {
  constructor(
    private readonly polticalDebatesService: PolticalDebatesService,
  ) {}

  @Post()
  create(@Body() createPolticalDebateDto: CreatePolticalDebateDto) {
    const data = this.polticalDebatesService.create(createPolticalDebateDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: '정치 토론방을  생성하였습니다.',
      data,
    };
  }

  @Get()
  findAll() {
    return this.polticalDebatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.polticalDebatesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePolticalDebateDto: UpdatePolticalDebateDto,
  ) {
    return this.polticalDebatesService.update(+id, updatePolticalDebateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.polticalDebatesService.remove(+id);
  }
}
