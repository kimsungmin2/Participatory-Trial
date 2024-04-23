import { IsNumber } from 'class-validator';

export class ParamOnlineBoardComment {
  @IsNumber()
  onlineBoardId: number;

  @IsNumber()
  commentId: number;
}
