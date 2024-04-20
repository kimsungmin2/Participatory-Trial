import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EmailService } from './email.service';

@Processor('email')
export class EmailProcessor {
  constructor(private readonly emailService: EmailService) {}

  @Process('sendVerificationEmail')
  async sendVerificationEmail(job: Job<{ email: string; code: number }>) {
    try {
      const { email, code } = job.data;

      await this.emailService.sendVerificationToEmail(email, code);
    } catch (error) {
      console.error('인증 이메일 전송 중 오류 발생', error);
      throw error;
    }
  }
}
