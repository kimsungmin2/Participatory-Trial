import { PartialType } from '@nestjs/mapped-types';
import { CreateHumorBoardDto } from './create-humor.dto';

export class UpdateHumorDto extends PartialType(CreateHumorBoardDto) {}
