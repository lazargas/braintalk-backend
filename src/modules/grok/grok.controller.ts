import { Controller, Post, Get, Body, UseGuards, Req, Query } from '@nestjs/common';
import { GrokService } from './grok.service';
import { TtsService } from '../tts/tts.service';
import { CacheService } from '../../common/services/cache.service';
import { GenerateResponseDto } from '../../common/dto/generate-response.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { CustomThrottlerGuard } from '../../common/guards/throttler.guard';

@UseGuards(CustomThrottlerGuard)
@Controller('api/grok')
export class GrokController {
  constructor(
    private readonly grokService: GrokService,
    private readonly ttsService: TtsService,
    private readonly cacheService: CacheService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generateResponse(@Body() generateResponseDto: GenerateResponseDto, @Req() req) {
    const userId = req.user.id;
    
    // Check cache first
    const cacheKey = `${userId}:${generateResponseDto.prompt}:${generateResponseDto.voiceId}`;
    const cachedResponse = await this.cacheService.get(cacheKey);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Get response from Grok AI
    const grokResponse = await this.grokService.getResponse(
      generateResponseDto.prompt,
      userId,
    );
    
    // Convert to speech
    const audioResult = await this.ttsService.generateSpeech(
      grokResponse.text,
      generateResponseDto.voiceId,
    );
    
    // Save audio details
    await this.grokService.saveAudioDetails(
      grokResponse.promptId,
      audioResult.url,
      generateResponseDto.voiceId,
      audioResult.duration,
    );
    
    const response = {
      text: grokResponse.text,
      audioUrl: audioResult.url,
      duration: audioResult.duration,
    };
    
    // Cache the response
    await this.cacheService.set(cacheKey, response, 3600); // Cache for 1 hour
    
    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getHistory(@Req() req, @Query('page') page = 1, @Query('limit') limit = 10) {
    const userId = req.user.id;
    return this.grokService.getUserHistory(userId, page, limit);
  }
}
