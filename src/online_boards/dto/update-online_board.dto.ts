import { PartialType } from '@nestjs/mapped-types';
import { CreateOnlineBoardDto } from './create-online_board.dto';

export class UpdateOnlineBoardDto extends PartialType(CreateOnlineBoardDto) {}
