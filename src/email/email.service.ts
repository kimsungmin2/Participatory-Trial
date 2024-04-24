import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Transporter } from 'nodemailer';

interface EmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;

  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {
    this.transporter = nodemailer.createTransport({
      service: process.env.email_service,
      auth: {
        user: process.env.user,
        pass: process.env.pass,
      },
    });
  }

  async queueVerificationEmail(email: string, code: number) {
    await this.emailQueue.add(
      'sendVerificationEmail',
      { email, code },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }

  async sendVerificationToEmail(email: string, code: number) {
    const emailOptions: EmailOptions = {
      from: process.env.user,
      to: email,
      subject: '가입 인증 메일',
      html: `<h1> 인증 코드를 입력하면 가입 인증이 완료됩니다.</h1><br/>${code}`,
    };

    return await this.transporter.sendMail(emailOptions);
  }
}
