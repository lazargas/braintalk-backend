import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateSpeechDto {
  @ApiProperty({
    description: 'The text to convert to speech',
    example: 'Hello, this is a test message',
  })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiProperty({
    description: 'The ID of the voice to use',
    example: 'voice-123',
  })
  @IsNotEmpty()
  @IsString()
  voiceId: string;

  @ApiProperty({
    description: 'The ID of the prompt associated with this speech',
    example: '60f1d23494bb11450edb3f9c',
    required: false,
  })
  @IsOptional()
  @IsString()
  promptId?: string;
}