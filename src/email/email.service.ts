import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

interface EmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.email_service,
      auth: {
        user: process.env.user,
        pass: process.env.pass,
      },
    });
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
