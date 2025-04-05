import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KrutrimModule } from './modules/krutrim/krutrim.module';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
// import { TypeOrmModule } from '@nestjs/typeorm'; // Comment out TypeORM
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GrokModule } from './modules/grok/grok.module';
import { TtsModule } from './modules/tts/tts.module';
import { UsersModule } from './modules/users/users.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    KrutrimModule,
    // Comment out TypeORM configuration
    // TypeOrmModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     type: 'mongodb',
    //     url: configService.get('MONGODB_URI'),
    //     entities: [__dirname + '/**/*.entity{.ts,.js}'],
    //     synchronize: true,
    //     useUnifiedTopology: true,
    //     useNewUrlParser: true,
    //   }),
    // }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 10,
        },
      ],
    }),
    CommonModule,
    GrokModule,
    TtsModule,
    UsersModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
