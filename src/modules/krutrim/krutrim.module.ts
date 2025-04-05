import { Module } from '@nestjs/common';
import { KrutrimService } from './krutrim.service';
import { KrutrimController } from './krutrim.controller';

@Module({
  providers: [KrutrimService],
  controllers: [KrutrimController],
  exports: [KrutrimService],
})
export class KrutrimModule {}