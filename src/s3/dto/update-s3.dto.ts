import { PartialType } from '@nestjs/mapped-types';
import { CreateS3Dto } from './create-s3.dto';

export class UpdateS3Dto extends PartialType(CreateS3Dto) {}
