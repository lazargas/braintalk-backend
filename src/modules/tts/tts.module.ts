import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TtsService } from './tts.service';
import { TtsController } from './tts.controller';
import { Voice, VoiceSchema } from './schemas/voice.schema';
import { KrutrimService } from '../krutrim/krutrim.service';
import { Prompt, PromptSchema } from '../grok/schemas/prompt.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Voice.name, schema: VoiceSchema },
      { name: Prompt.name, schema: PromptSchema }, // Add Prompt model here
    ]),
  ],
  controllers: [TtsController],
  providers: [TtsService, KrutrimService],
  exports: [TtsService, KrutrimService],
})
export class TtsModule {}
