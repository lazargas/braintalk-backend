import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';

@Injectable()
export class S3Service {
  private s3: S3;

  constructor(private configService: ConfigService) {
    this.s3 = new S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION'),
      endpoint: this.configService.get('AWS_ENDPOINT'),
      s3ForcePathStyle: this.configService.get('AWS_S3_FORCE_PATH_STYLE') === 'true',
    });
  }

  async uploadFile(
    file: Buffer,
    key: string,
    contentType: string,
  ): Promise<string> {
    const params = {
      Bucket: this.configService.get('AWS_BUCKET_NAME'),
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read',
    };

    const result = await this.s3.upload(params).promise();
    return result.Location;
  }

  async deleteFile(key: string): Promise<void> {
    const params = {
      Bucket: this.configService.get('AWS_BUCKET_NAME'),
      Key: key,
    };

    await this.s3.deleteObject(params).promise();
  }
}