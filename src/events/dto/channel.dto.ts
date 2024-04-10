import { IsEnum } from 'class-validator';
import { ChannelType } from '../type/channeltype';

export class ChannelTypeDto {
  @IsEnum(ChannelType)
  channelType: ChannelType;
}
