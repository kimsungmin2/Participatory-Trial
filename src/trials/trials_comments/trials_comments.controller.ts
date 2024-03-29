import { Controller } from '@nestjs/common';
import { TrialsCommentsService } from './trials_comments.service';

@Controller('trials-comments')
export class TrialsCommentsController {
  constructor(private readonly trialsCommentsService: TrialsCommentsService) {}
}
