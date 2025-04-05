import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { TtsService } from './tts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GenerateSpeechDto } from './dto/generate-speech.dto';

@ApiTags('tts')
@Controller('api/tts')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  @Get('voices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all available voices from ElevenLabs' })
  @ApiResponse({ status: 200, description: 'Returns the list of available voices' })
  async getVoices() {
    return this.ttsService.getVoices();
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate speech from text using ElevenLabs' })
  @ApiResponse({ status: 200, description: 'Returns the generated audio URL and metadata' })
  async generateSpeech(@Body() generateSpeechDto: GenerateSpeechDto) {
    const { text, voiceId } = generateSpeechDto;
    return this.ttsService.generateSpeech(text, voiceId);
  }
}