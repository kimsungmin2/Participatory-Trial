import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TrialsService } from './trials.service';
import { CreateTrialDto } from './dto/create-trial.dto';
import { UpdateTrialDto } from './dto/update-trial.dto';

@Controller('trials')
export class TrialsController {
  constructor(private readonly trialsService: TrialsService) {}

  @Post()
  create(@Body() createTrialDto: CreateTrialDto) {
    return this.trialsService.create(createTrialDto);
  }

  @Get()
  findAll() {
    return this.trialsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trialsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTrialDto: UpdateTrialDto) {
    return this.trialsService.update(+id, updateTrialDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trialsService.remove(+id);
  }
}
