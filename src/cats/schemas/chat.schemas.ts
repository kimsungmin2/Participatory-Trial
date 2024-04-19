import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatDocument = Chat & Document;

@Schema()
export class Chat {
  @Prop()
  id: number;

  @Prop()
  message: string;

  @Prop()
  timestamp: string;

  @Prop()
  userId: number;

  @Prop()
  RoomId: number;

  @Prop()
  userName: string;
  
  @Prop()
  channelType: string;
}

export const CatSchema = SchemaFactory.createForClass(Chat);
