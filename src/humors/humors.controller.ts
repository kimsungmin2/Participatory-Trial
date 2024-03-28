import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HumorsService } from './humors.service';
import { CreateHumorDto } from './dto/create-humor.dto';
import { UpdateHumorDto } from './dto/update-humor.dto';

@Controller('humors')
export class HumorsController {
  constructor(private readonly humorsService: HumorsService) {}

  @Post()
  create(@Body() createHumorDto: CreateHumorDto) {
    return this.humorsService.create(createHumorDto);
  }

  @Get()
  findAll() {
    return this.humorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.humorsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHumorDto: UpdateHumorDto) {
    return this.humorsService.update(+id, updateHumorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.humorsService.remove(+id);
  }
}
