import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheck,
  MongooseHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private mongoose: MongooseHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
      // Increase the disk threshold to 0.95 (95%)
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.95 }),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }

  @Get('grok')
  @HealthCheck()
  checkGrok() {
    return this.health.check([
      () => this.http.pingCheck('grok_api', this.configService.get('GROK_API_URL') || ''),
    ]);
  }

  @Get('tts')
  @HealthCheck()
  checkTts() {
    // Use a specific endpoint for the TTS API health check
    const ttsApiUrl = this.configService.get('TTS_API_URL');
    return this.health.check([
      () => this.http.pingCheck('tts_api', `${ttsApiUrl}/voices`),
    ]);
  }
}