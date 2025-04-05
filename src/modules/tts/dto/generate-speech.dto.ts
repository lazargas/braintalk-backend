import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateSpeechDto {
  @ApiProperty({
    description: 'The text to convert to speech',
    example: 'Hello, this is a text to speech conversion example',
  })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiProperty({
    description: 'The ID of the voice to use for text-to-speech',
    example: '21m00Tcm4TlvDq8ikWAM',
  })
  @IsNotEmpty()
  @IsString()
  voiceId: string;
}