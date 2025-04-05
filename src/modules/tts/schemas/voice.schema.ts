import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VoiceDocument = Voice & Document;

@Schema({ timestamps: true })
export class Voice {
  @Prop({ required: true })
  externalId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  category: string;

  @Prop()
  imageUrl: string;

  @Prop()
  sampleUrl: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const VoiceSchema = SchemaFactory.createForClass(Voice);