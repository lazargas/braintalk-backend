import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { KrutrimService } from './krutrim.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PromptDto } from './dto/prompt.dto';

@ApiTags('krutrim')
@Controller('krutrim')
export class KrutrimController {
  constructor(private readonly krutrimService: KrutrimService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a response from Krutrim AI' })
  @ApiResponse({ status: 200, description: 'Returns the AI response' })
  async generateResponse(@Body() promptDto: PromptDto) {
    const response = await this.krutrimService.generateResponse(promptDto.prompt);
    return { response };
  }

  @Post('stream')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stream a response from Krutrim AI' })
  @ApiResponse({ status: 200, description: 'Streams the AI response' })
  async streamResponse(@Body() promptDto: PromptDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const stream = await this.krutrimService.generateStreamingResponse(promptDto.prompt);
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
}