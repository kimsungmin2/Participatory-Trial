import {
  PutObjectCommand,
  PutObjectOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { BoardType } from './type/board-type';
import { send } from 'process';
import { InternalServerErrorException } from '@nestjs/common';
import { createS3Client } from 'mock-aws-s3-v3';

const mockFile: Express.Multer.File[] = [
  {
    fieldname: 'file',
    originalname: 'testfile.txt',
    encoding: '7bit',
    mimetype: 'text/plain',
    size: 128,
    destination: './upload',
    filename: 'testfile.txt',
    path: './upload/testfile.txt',
    buffer: Buffer.from('Hello World'),
    stream: Readable.from(Buffer.from('Hello World')),
  },
];
const mockS3Client = {
  send: jest.fn(),
};

describe('HumorsService', () => {
  let s3Service: S3Service;
  let configService: Partial<ConfigService>;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'AWS_REGION':
            return 'us-west-2';
          case 'AWS_S3_ACCESS_KEY':
            return 'ACCESS_KEY';
          case 'AWS_S3_SECRET_KEY':
            return 'SECRET_KEY';
          case 'AWS_S3_BUCKET_NAME':
            return 'exmaple-bucket';
          default:
            return null;
        }
      }),
    };

    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,

        { provide: ConfigService, useClass: ConfigService },
        {
          provide: 'S3', // 실제 S3 서비스를 대체하는 목(Mock)
          useValue: mockS3Client,
        },
      ],
    }).compile();

    s3Service = module.get<S3Service>(S3Service);
    configService = module.get<ConfigService>(ConfigService);
  });
  it('should be defined', () => {
    expect(s3Service).toBeDefined();
    expect(configService).toBeDefined();
  });

  describe('saveImages', () => {
    it('must success', async () => {
      jest
        .spyOn(s3Service, 'imageUpload')
        .mockResolvedValue({ imageUrl: 'hello' });
      const url = await s3Service.saveImages(mockFile, BoardType.Humor);
      expect(s3Service.imageUpload).toHaveBeenCalledTimes(1);
      expect(url).toEqual([{ imageUrl: 'hello' }]);
    });
  });
  describe('imageUpload', () => {
    const mockUrl = 'boardType/imageName.ext';
    it('must success', async () => {
      jest.spyOn(s3Service, 'imageUploadToS3').mockResolvedValue(mockUrl);
      const imageUrl = await s3Service.imageUpload(
        mockFile[0],
        BoardType.Humor,
      );
      expect(s3Service.imageUploadToS3).toHaveBeenCalledTimes(1);
      expect(imageUrl).toEqual({ imageUrl: 'boardType/imageName.ext' });
    });
  });
  describe('imageUploadToS3', () => {
    const mockUrl = 'boardType/imageName.ext';
    const mockPutObjectResponse: PutObjectOutput = {
      ETag: '"9a0364b9e99bb480dd25e1f0284c8555"',
    };
    it('should handle S3 upload errors gracefully', async () => {
      jest
        .spyOn(s3Service, 'imageUploadToS3')
        .mockRejectedValue(
          new InternalServerErrorException(
            '이미지 저장 중 오류가 발생했습니다.',
          ),
        );
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'testimage.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('This is a test file'),
      } as Express.Multer.File;

      await expect(
        s3Service.imageUpload(file, BoardType.Humor),
      ).rejects.toThrow(InternalServerErrorException);
    });
    // it('should upload image to S3 and return URL', async () => {
    //   // 목(Mock)의 응답 설정
    //   mockS3Client.send.mockResolvedValue({});

    //   const fileName = 'example.jpg';
    //   const file = {
    //     buffer: Buffer.from('fake image data'), // 가짜 이미지 데이터
    //   };
    //   const ext = 'jpg';

    //   const result = await s3Service.imageUploadToS3(
    //     fileName,
    //     mockFile[0],
    //     ext,
    //   );

    //   expect(result).toMatch(
    //     `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_S3_BUCKET_NAME}/${fileName}`,
    //   );
    //   expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(Object));
    // });

    it('should throw InternalServerErrorException when upload fails', async () => {
      mockS3Client.send.mockRejectedValue(new Error('Upload failed'));

      const fileName = 'example.jpg';
      const file = {
        buffer: Buffer.from('fake image data'),
      };
      const ext = 'jpg';

      await expect(
        s3Service.imageUploadToS3(fileName, mockFile[0], ext),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
