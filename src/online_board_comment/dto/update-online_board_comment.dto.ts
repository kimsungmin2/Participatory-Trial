import { PartialType } from '@nestjs/mapped-types';
import { CreateOnlineBoardCommentDto } from './create-online_board_comment.dto';

export class UpdateOnlineBoardCommentDto extends PartialType(CreateOnlineBoardCommentDto) {}
