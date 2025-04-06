import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { KrutrimService } from './krutrim.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PromptDto } from './dto/prompt.dto';
import { Get, Query, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prompt, PromptDocument } from '../grok/schemas/prompt.schema';

@ApiTags('krutrim')
@Controller('api/krutrim')
export class KrutrimController {
  constructor(
    private readonly krutrimService: KrutrimService,
    @InjectModel(Prompt.name) private promptModel: Model<PromptDocument>
  ) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a response from Krutrim AI' })
  @ApiResponse({ status: 200, description: 'Returns the AI response' })
  async generateResponse(@Body() promptDto: PromptDto, @Req() req) {
    const userId = req.user.id;
    const response = await this.krutrimService.generateResponse(promptDto.prompt, userId);
    return { response };
  }

  @Post('stream')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stream a response from Krutrim AI' })
  @ApiResponse({ status: 200, description: 'Streams the AI response' })
  async streamResponse(@Body() promptDto: PromptDto, @Req() req, @Res() res: Response) {
    const userId = req.user.id;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
  
    try {
      const { stream, promptId } = await this.krutrimService.generateStreamingResponse(promptDto.prompt, userId);
      
      // Send the promptId first
      res.write(`data: ${JSON.stringify({ promptId })}\n\n`);
      
      let fullResponse = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      
      // Update the prompt record with the full response
      await this.krutrimService.updatePromptResponse(promptId, fullResponse);
      
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user history' })
  @ApiResponse({ status: 200, description: 'Returns the user history' })
  async getHistory(@Req() req, @Query('page') page = 1, @Query('limit') limit = 10) {
    const userId = req.user.id;
    return this.krutrimService.getUserHistory(userId, page, limit);
  }
}