import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): any {
    return req.user?.id ? `${req.ip}-${req.user.id}` : req.ip;
  }
}
