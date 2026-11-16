import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { prisma } from '@repo/database';
import { AppService } from './app.service';

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
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('Database unreachable');
    }
    return { status: 'ok', db: 'ok', time: new Date().toISOString() };
  }
}
