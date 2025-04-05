import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PromptDto {
  @ApiProperty({
    description: 'The prompt to send to Krutrim AI',
    example: 'Tell me a joke about programming',
  })
  @IsNotEmpty()
  @IsString()
  prompt: string;
}