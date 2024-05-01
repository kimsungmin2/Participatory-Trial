import { EmailService } from '../email/email.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bull';
import * as nodemailer from 'nodemailer';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// Mock nodemailer at the top level
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('EmailService', () => {
  let service: EmailService;
  let mockEmailQueue: DeepMockProxy<Queue>;
  let mockTransporter: DeepMockProxy<nodemailer.Transporter>;

  beforeEach(async () => {
    mockEmailQueue = mockDeep<Queue>();
    mockTransporter = mockDeep<nodemailer.Transporter>();
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
    mockTransporter.sendMail.mockResolvedValue('Email sent');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: 'BullQueue_email', useValue: mockEmailQueue },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should queue verification email', async () => {
    const email = 'user@example.com';
    const code = 123456;
    await service.queueVerificationEmail(email, code);

    expect(mockEmailQueue.add).toHaveBeenCalledWith(
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
  });

  it('should send verification email', async () => {
    const email = 'user@example.com';
    const code = 123456;
    const result = await service.sendVerificationToEmail(email, code);

    expect(mockTransporter.sendMail).toHaveBeenCalledWith({
      from: process.env.user,
      to: email,
      subject: '가입 인증 메일',
      html: `<h1> 인증 코드를 입력하면 가입 인증이 완료됩니다.</h1><br/>${code}`,
    });
    expect(result).toEqual('Email sent');
  });
});
