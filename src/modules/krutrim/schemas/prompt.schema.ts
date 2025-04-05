import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PromptDocument = Prompt & Document;

@Schema({ timestamps: true })
export class Prompt {
  @Prop({ required: true })
  text: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Object })
  response: any;

  @Prop({ type: String, nullable: true })
  audioUrl: string;

  @Prop({ type: String })
  voiceId: string;

  @Prop({ type: Number, default: 0 })
  duration: number;
  
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const PromptSchema = SchemaFactory.createForClass(Prompt);