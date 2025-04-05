import { Module, Global } from '@nestjs/common';
import { CacheService } from './services/cache.service';
import { LoggerService } from './services/logger.service';

@Global()
@Module({
  providers: [CacheService, LoggerService],
  exports: [CacheService, LoggerService],
})
export class CommonModule {}
