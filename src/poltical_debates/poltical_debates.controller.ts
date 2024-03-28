import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PolticalDebatesService } from './poltical_debates.service';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';
import { UpdatePolticalDebateDto } from './dto/update-poltical_debate.dto';

@Controller('poltical-debates')
export class PolticalDebatesController {
  constructor(private readonly polticalDebatesService: PolticalDebatesService) {}

  @Post()
  create(@Body() createPolticalDebateDto: CreatePolticalDebateDto) {
    return this.polticalDebatesService.create(createPolticalDebateDto);
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
  update(@Param('id') id: string, @Body() updatePolticalDebateDto: UpdatePolticalDebateDto) {
    return this.polticalDebatesService.update(+id, updatePolticalDebateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.polticalDebatesService.remove(+id);
  }
}
