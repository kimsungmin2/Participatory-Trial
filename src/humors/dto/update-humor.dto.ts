import { PartialType } from '@nestjs/mapped-types';
import { CreateHumorDto } from './create-humor.dto';

export class UpdateHumorDto extends PartialType(CreateHumorDto) {}
