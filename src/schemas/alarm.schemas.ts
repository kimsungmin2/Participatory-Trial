import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type AlarmDocument = Alarm & Document;
@Schema()
export class Alarm {
  @Prop()
  id: number;
  @Prop()
  message: string;
  @Prop()
  timestamp: Date;
  @Prop()
  userId: number;
  @Prop()
  boardId: number;
  @Prop()
  channelType: string;
}
export const AlarmSchema = SchemaFactory.createForClass(Alarm);
