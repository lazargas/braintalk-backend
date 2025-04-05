import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GrokService } from './grok.service';
import { GrokController } from './grok.controller';
import { Prompt, PromptSchema } from './schemas/prompt.schema';
import { TtsModule } from '../tts/tts.module';
// Remove the CacheModule import
// import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Prompt.name, schema: PromptSchema }]),
    TtsModule,
    // Remove the CacheModule.register() line
    // CacheModule.register(),
  ],
  controllers: [GrokController],
  providers: [GrokService],
  exports: [GrokService],
})
export class GrokModule {}