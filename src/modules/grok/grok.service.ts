import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prompt, PromptDocument } from './schemas/prompt.schema';

@Injectable()
export class GrokService {
  private readonly logger = new Logger(GrokService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(
    private configService: ConfigService,
    @InjectModel(Prompt.name) private promptModel: Model<PromptDocument>,
  ) {
    this.apiUrl = this.configService.get<string>('GROK_API_URL') || '';
    this.apiKey = this.configService.get<string>('GROK_API_KEY') || '';
  }

  async getResponse(prompt: string, userId: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/completions`,
        {
          prompt,
          max_tokens: 1000,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const responseText = response.data.choices[0].text.trim();
      
      // Save the prompt and response
      const promptRecord = new this.promptModel({
        text: prompt,
        userId,
        response: {
          text: responseText,
          raw: response.data,
        },
      });
      
      await promptRecord.save();

      return {
        text: responseText,
        promptId: promptRecord._id,
        raw: response.data,
      };
    } catch (error) {
      this.logger.error(`Failed to get response from Grok AI: ${error.message}`);
      throw new HttpException(
        'Failed to get response from Grok AI',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async saveAudioDetails(promptId: string, audioUrl: string, voiceId: string, duration: number): Promise<void> {
    await this.promptModel.findByIdAndUpdate(promptId, {
      audioUrl,
      voiceId,
      duration,
    });
  }

  async getUserHistory(userId: string, page = 1, limit = 10): Promise<any> {
    const skip = (page - 1) * limit;
    
    const prompts = await this.promptModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    
    const total = await this.promptModel.countDocuments({ userId });
    
    return {
      prompts: prompts.map(prompt => ({
        id: prompt._id,
        text: prompt.text,
        responseText: prompt.response?.text,
        audioUrl: prompt.audioUrl,
        voiceId: prompt.voiceId,
        duration: prompt.duration,
        createdAt: prompt.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}