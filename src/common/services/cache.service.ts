import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis.Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis.default({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
    });

    this.redis.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });
  }

  async get(key: string): Promise<any> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Cache get error: ${error.message}`);
      return null;
    }
  }

  async set(key: string, value: any, expiryInSeconds = 3600): Promise<boolean> {
    try {
      await this.redis.set(
        key,
        JSON.stringify(value),
        'EX',
        expiryInSeconds,
      );
      return true;
    } catch (error) {
      this.logger.error(`Cache set error: ${error.message}`);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Cache delete error: ${error.message}`);
      return false;
    }
  }
}