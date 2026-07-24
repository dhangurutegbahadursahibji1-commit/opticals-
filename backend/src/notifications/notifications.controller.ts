import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VIEWER','STAFF','MANAGER','ADMIN','SUPER_ADMIN')
@Controller('admin/notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}
  @Get() findAll(@Query() q: PaginationQueryDto & { unreadOnly?: string }) { return this.service.findAll(q); }
  @Patch(':id/read') markRead(@Param('id') id: string) { return this.service.markRead(id); }
  @Patch('read-all') markAllRead() { return this.service.markAllRead(); }
}
