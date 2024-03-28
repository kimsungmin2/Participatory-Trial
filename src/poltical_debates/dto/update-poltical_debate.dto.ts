import { PartialType } from '@nestjs/mapped-types';
import { CreatePolticalDebateDto } from './create-poltical_debate.dto';

export class UpdatePolticalDebateDto extends PartialType(CreatePolticalDebateDto) {}
