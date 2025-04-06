import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prompt, PromptDocument } from '../grok/schemas/prompt.schema';

@Injectable()
export class KrutrimService {
  private readonly logger = new Logger(KrutrimService.name);
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(
    private configService: ConfigService,
    @InjectModel(Prompt.name) private promptModel: Model<PromptDocument>
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('KRUTRIM_API_KEY') || '',
      baseURL: this.configService.get<string>('KRUTRIM_API_URL') || '',
    });
    this.model = this.configService.get<string>('KRUTRIM_MODEL') || '';
  }

  // Save prompt to database
  async savePrompt(prompt: string, userId: string, responseText: string): Promise<any> {
    this.logger.log(`Saving prompt to database: ${prompt.substring(0, 50)}...`);
    
    const promptRecord = new this.promptModel({
      text: prompt,
      userId,
      response: {
        text: responseText,
      },
      createdAt: new Date(),
    });
    
    await promptRecord.save();
    return promptRecord;
  }

  // Update prompt response
  async updatePromptResponse(promptId: string, responseText: string): Promise<void> {
    await this.promptModel.findByIdAndUpdate(promptId, {
      'response.text': responseText,
    });
  }

  // Updated to accept userId and save to database
  async generateResponse(prompt: string, userId: string): Promise<any> {
    try {
      this.logger.log(`Generating response for prompt: ${prompt.substring(0, 50)}...`);
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
      });

      const responseText = response.choices[0].message.content || '';
      
      // Save the prompt and response
      const promptRecord = await this.savePrompt(prompt, userId, responseText);
      
      return {
        text: responseText,
        promptId: promptRecord._id,
      };
    } catch (error) {
      this.logger.error(`Failed to generate response: ${error.message}`);
      throw error;
    }
  }

  // Update streaming response to save to database
  async generateStreamingResponse(prompt: string, userId: string): Promise<any> {
    try {
      this.logger.log(`Generating streaming response for prompt: ${prompt.substring(0, 50)}...`);
      
      // First save an empty prompt record to get an ID
      const promptRecord = new this.promptModel({
        text: prompt,
        userId,
        response: {
          text: '',
        },
        createdAt: new Date(),
      });
      
      await promptRecord.save();
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: true,
        max_tokens: 1000,
      });

      // Return both the stream and the promptId
      return {
        stream: response,
        promptId: promptRecord._id,
      };
    } catch (error) {
      this.logger.error(`Failed to generate streaming response: ${error.message}`);
      throw error;
    }
  }

  // Save audio details
  async saveAudioDetails(promptId: string, audioUrl: string, voiceId: string, duration: number): Promise<void> {
    await this.promptModel.findByIdAndUpdate(promptId, {
      audioUrl,
      voiceId,
      duration,
    });
  }

  // Get user history
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
        audioUrl: prompt.audioUrl || '',
        voiceId: prompt.voiceId || '',
        duration: prompt.duration || 0,
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
