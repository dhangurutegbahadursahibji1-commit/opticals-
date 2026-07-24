import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

// Spec: "Health Endpoint, Readiness Endpoint, Liveness Endpoint, Database Health,
// Cloudflare R2 Health." Used by Render's health checks and uptime monitors.
@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService) {}

  @Public()
  @Get('health')
  async health(@Res() res: Response) {
    res.status(HttpStatus.OK).json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  @Public()
  @Get('health/live')
  liveness(@Res() res: Response) {
    // Process is up and handling requests — doesn't touch external dependencies.
    res.status(HttpStatus.OK).json({ status: 'alive' });
  }

  @Public()
  @Get('health/ready')
  async readiness(@Res() res: Response) {
    const [dbOk, r2Ok] = await Promise.all([this.checkDatabase(), this.storage.healthCheck()]);
    const ready = dbOk && r2Ok;
    res
      .status(ready ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
      .json({ status: ready ? 'ready' : 'not_ready', database: dbOk, storage: r2Ok });
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
