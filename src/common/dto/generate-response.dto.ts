import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateResponseDto {
  @ApiProperty({
    description: 'The prompt to send to Grok AI',
    example: 'Tell me a joke about programming',
  })
  @IsNotEmpty()
  @IsString()
  prompt: string;

  @ApiProperty({
    description: 'The ID of the voice to use for text-to-speech',
    example: 'voice-123',
  })
  @IsNotEmpty()
  @IsString()
  voiceId: string;
}
