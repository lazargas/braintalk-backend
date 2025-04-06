import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KrutrimService } from './krutrim.service';
import { KrutrimController } from './krutrim.controller';
import { Prompt, PromptSchema } from '../grok/schemas/prompt.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Prompt.name, schema: PromptSchema }]),
  ],
  providers: [KrutrimService],
  controllers: [KrutrimController],
  exports: [KrutrimService],
})
export class KrutrimModule {}