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
      // Create a new prompt document in the database
      const newPrompt = new this.promptModel({
        userId,
        text: prompt,
        createdAt: new Date(),
      });
      
      const savedPrompt = await newPrompt.save();
      
      // Get response from API directly instead of using non-existent grokApiService
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
      
      // Update the prompt document with the response
      await this.promptModel.findByIdAndUpdate(savedPrompt._id, {
        response: {
          text: responseText,
          raw: response.data,
        },
      });
      
      return {
        text: responseText,
        promptId: savedPrompt._id,
      };
    } catch (error) {
      this.logger.error(`Error getting response from Grok: ${error.message}`);
      throw new HttpException(
        'Failed to get response from Grok',
        HttpStatus.INTERNAL_SERVER_ERROR
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