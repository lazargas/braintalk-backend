import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { TtsService } from './tts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GenerateSpeechDto } from './dto/generate-speech.dto';
import { KrutrimService } from '../krutrim/krutrim.service';

@ApiTags('tts')
@Controller('api/tts')
export class TtsController {
  constructor(
    private readonly ttsService: TtsService,
    private readonly krutrimService: KrutrimService, // Make sure KrutrimService is injected
  ) {}

  @Get('voices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all available voices from ElevenLabs' })
  @ApiResponse({
    status: 200,
    description: 'Returns the list of available voices',
  })
  async getVoices() {
    return this.ttsService.getVoices();
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate speech from text' })
  @ApiResponse({ status: 200, description: 'Returns the generated audio URL' })
  async generateSpeech(
    @Body() generateSpeechDto: GenerateSpeechDto,
    @Req() req,
  ) {
    try {
      const { text, voiceId, promptId } = generateSpeechDto;
      const userId = req.user.id;

      // Generate speech
      const result = await this.ttsService.generateSpeech(text, voiceId);

      // If promptId is provided, save the audio details to the prompt
      if (promptId) {
        await this.krutrimService.saveAudioDetails(
          promptId,
          result.url,
          voiceId,
          result.duration,
        );
      }

      return {
        url: result.url,
        duration: result.duration,
        format: result.format,
        promptId,
      };
    } catch (error) {
      throw error;
    }
  }
}
