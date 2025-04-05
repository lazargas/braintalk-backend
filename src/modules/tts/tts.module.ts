import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TtsService } from './tts.service';
import { TtsController } from './tts.controller';
import { Voice, VoiceSchema } from './schemas/voice.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Voice.name, schema: VoiceSchema }]),
  ],
  controllers: [TtsController],
  providers: [TtsService],
  exports: [TtsService],
})
export class TtsModule {}