import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { prisma } from '@repo/database';
import { AppService } from './app.service';

const HEALTH_CACHE_MS = 5000;
const lastDbCheck: { at: number; pending: Promise<boolean> | null } = {
  at: 0,
  pending: null,
};

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): object {
    return this.appService.getHello();
  }

  /**
   * For uptime monitors: 200 when the API can reach the database, 503 when
   * it cannot. Not rate limited so monitors are never blocked.
   */
  @SkipThrottle()
  @Get('health')
  async health(): Promise<{ status: 'ok'; db: 'ok'; time: string }> {
    // The DB check is reused for a few seconds, so hammering this
    // unthrottled endpoint can't flood the database connection pool.
    const now = Date.now();
    if (!lastDbCheck.pending || now - lastDbCheck.at > HEALTH_CACHE_MS) {
      lastDbCheck.at = now;
      lastDbCheck.pending = prisma.$queryRaw`SELECT 1`.then(
        () => true,
        () => false,
      );
    }
    const ok = await lastDbCheck.pending;
    if (!ok) {
      throw new ServiceUnavailableException('Database unreachable');
    }
    return { status: 'ok', db: 'ok', time: new Date().toISOString() };
  }
}
