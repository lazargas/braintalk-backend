import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Voice, VoiceDocument } from './schemas/voice.schema';
import axios from 'axios';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly s3: AWS.S3;

  // In the constructor, update the S3 initialization
  constructor(
    private configService: ConfigService,
    @InjectModel(Voice.name) private voiceModel: Model<VoiceDocument>,
  ) {
    this.apiUrl = this.configService.get<string>('TTS_API_URL') || '';
    this.apiKey = this.configService.get<string>('TTS_API_KEY') || '';
  
    // Initialize AWS S3 with proper configuration
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get<string>('AWS_REGION'),
      endpoint: this.configService.get<string>('AWS_ENDPOINT'),
      s3ForcePathStyle: this.configService.get<string>('AWS_S3_FORCE_PATH_STYLE') === 'true',
      signatureVersion: 'v4',
    });
  }

  async getAvailableVoices(): Promise<Voice[]> {
    try {
      // First check if we have voices in our database
      const dbVoices = await this.voiceModel.find({ isActive: true }).exec();
      
      if (dbVoices.length > 0) {
        return dbVoices;
      }

      // If not, fetch from the API and save to database
      const response = await axios.get(`${this.apiUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      const voices = response.data.voices.map(voice => ({
        externalId: voice.voice_id,
        name: voice.name,
        category: voice.category || 'general',
        imageUrl: voice.preview_url ? `https://avatars.elevenlabs.io/${voice.voice_id}` : null,
        sampleUrl: voice.preview_url,
        isActive: true,
      }));

      // Save voices to database
      await this.voiceModel.insertMany(voices);

      return voices;
    } catch (error) {
      this.logger.error(`Failed to fetch voices: ${error.message}`);
      throw new HttpException(
        'Failed to fetch available voices',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Update the generateSpeech method to include better error handling
  async generateSpeech(text: string, voiceId: string): Promise<any> {
    try {
      // Generate audio using TTS API (ElevenLabs in this case)
      const response = await axios.post(
        `${this.apiUrl}/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          responseType: 'arraybuffer',
        },
      );
  
      this.logger.log(`Successfully generated speech from ElevenLabs, uploading to S3...`);
      
      // Upload to S3
      const fileName = `${uuidv4()}.mp3`;
      const bucketName = this.configService.get<string>('AWS_BUCKET_NAME') || '';
      const key = `audio/${fileName}`;
      
      try {
        // Remove the ACL parameter as it might be causing issues
        const s3Response = await this.s3.upload({
          Bucket: bucketName,
          Key: key,
          Body: response.data,
          ContentType: 'audio/mpeg',
          // Remove ACL: 'public-read' as it might not be supported
        }).promise();
        
        this.logger.log(`Successfully uploaded audio to S3: ${s3Response.Location}`);
        
        // Generate a pre-signed URL that will work for 24 hours
        const signedUrl = this.s3.getSignedUrl('getObject', {
          Bucket: bucketName,
          Key: key,
          Expires: 86400, // 24 hours in seconds
        });
        
        this.logger.log(`Generated pre-signed URL: ${signedUrl}`);
  
        // Calculate approximate duration (rough estimate)
        const wordCount = text.split(' ').length;
        const durationInSeconds = wordCount * 0.5; // Rough estimate: 0.5 seconds per word
  
        return {
          url: signedUrl, // Return the pre-signed URL instead of the direct S3 URL
          duration: durationInSeconds,
          format: 'mp3',
        };
      } catch (s3Error) {
        // Log the specific S3 error
        this.logger.error(`S3 upload error: ${s3Error.message}`);
        this.logger.error(`S3 error details: ${JSON.stringify(s3Error)}`);
        throw new HttpException(
          `Failed to upload audio to S3: ${s3Error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      this.logger.error(`TTS generation error: ${error.message}`);
      throw new HttpException(
        'Failed to generate speech',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  // Add this method to your TtsService class
  async getVoices() {
    try {
      const response = await axios.get(`${this.apiUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });
      
      return response.data.voices.map(voice => ({
        id: voice.voice_id,
        name: voice.name,
        description: voice.description || '',
        preview_url: voice.preview_url || '',
      }));
    } catch (error) {
      this.logger.error(`Failed to get voices: ${error.message}`);
      throw new HttpException('Failed to get voices from ElevenLabs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}