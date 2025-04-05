import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class KrutrimService {
  private readonly logger = new Logger(KrutrimService.name);
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('KRUTRIM_API_KEY') || '',
      baseURL: this.configService.get<string>('KRUTRIM_API_URL') || '',
    });
    this.model = this.configService.get<string>('KRUTRIM_MODEL') || '';
  }

  async generateResponse(prompt: string): Promise<string> {
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

      return response.choices[0].message.content || '';
    } catch (error) {
      this.logger.error(`Failed to generate response: ${error.message}`);
      throw error;
    }
  }

  async generateStreamingResponse(prompt: string): Promise<any> {
    try {
      this.logger.log(`Generating streaming response for prompt: ${prompt.substring(0, 50)}...`);
      
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

      return response;
    } catch (error) {
      this.logger.error(`Failed to generate streaming response: ${error.message}`);
      throw error;
    }
  }
}
