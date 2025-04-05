import {
  Injectable,
  LoggerService as NestLoggerService,
  Scope,
} from '@nestjs/common';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    const environment = this.configService.get('NODE_ENV') || 'development';

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(
            ({ timestamp, level, message, context, trace }) => {
              return `${timestamp} [${context}] ${level}: ${message}${
                trace ? `\n${trace}` : ''
              }`;
            },
          ),
        ),
        stderrLevels: ['error'],
      }),
    ];

    // Add file transport in production
    if (environment === 'production') {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );
    }

    this.logger = winston.createLogger({
      level: environment === 'production' ? 'info' : 'debug',
      transports,
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    context = context || this.context;

    if (message instanceof Object) {
      const { message: msg, ...meta } = message;

      return this.logger.info({
        message: msg,
        context,
        ...meta,
      });
    }

    return this.logger.info({
      message,
      context,
    });
  }

  error(message: any, trace?: string, context?: string) {
    context = context || this.context;

    if (message instanceof Error) {
      // Capture stack trace
      trace = trace || message.stack;

      return this.logger.error({
        message: message.message,
        context,
        trace,
      });
    }

    if (message instanceof Object) {
      const { message: msg, ...meta } = message;

      return this.logger.error({
        message: msg,
        context,
        trace,
        ...meta,
      });
    }

    return this.logger.error({
      message,
      context,
      trace,
    });
  }

  warn(message: any, context?: string) {
    context = context || this.context;

    if (message instanceof Object) {
      const { message: msg, ...meta } = message;

      return this.logger.warn({
        message: msg,
        context,
        ...meta,
      });
    }

    return this.logger.warn({
      message,
      context,
    });
  }

  debug(message: any, context?: string) {
    context = context || this.context;

    if (message instanceof Object) {
      const { message: msg, ...meta } = message;

      return this.logger.debug({
        message: msg,
        context,
        ...meta,
      });
    }

    return this.logger.debug({
      message,
      context,
    });
  }

  verbose(message: any, context?: string) {
    context = context || this.context;

    if (message instanceof Object) {
      const { message: msg, ...meta } = message;

      return this.logger.verbose({
        message: msg,
        context,
        ...meta,
      });
    }

    return this.logger.verbose({
      message,
      context,
    });
  }
}
