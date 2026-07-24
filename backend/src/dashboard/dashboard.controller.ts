import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VIEWER','STAFF','MANAGER','ADMIN','SUPER_ADMIN')
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}
  @Get('stats') getStats() { return this.service.getStats(); }
  @Get('search') search(@Query('q') q: string) { return this.service.globalSearch(q ?? ''); }
}
