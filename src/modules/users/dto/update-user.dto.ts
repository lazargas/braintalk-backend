import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ required: false, description: 'User name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, description: 'User email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, description: 'User password' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}