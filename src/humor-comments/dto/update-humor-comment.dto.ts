import { PartialType } from '@nestjs/mapped-types';
import { CreateHumorCommentDto } from './create-humor-comment.dto';

export class UpdateHumorCommentDto extends PartialType(CreateHumorCommentDto) {}
