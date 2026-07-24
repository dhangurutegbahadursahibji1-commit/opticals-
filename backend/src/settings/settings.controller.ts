import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types';

@ApiTags('settings')
@Controller('settings')
export class SettingsPublicController {
  constructor(private readonly service: SettingsService) {}
  @Public() @Get() findAll() { return this.service.findAll(); }
}

// Keys that carry sensitive, owner-only data (bank/UPI details today — extend
// this set if a future setting shouldn't be editable by plain ADMIN staff).
// This check runs regardless of which key the wildcard route below resolves
// to, so it can't be bypassed by hitting this same endpoint with a different
// key name than the admin UI happens to use.
const SUPER_ADMIN_ONLY_KEYS = new Set(['paymentSettings']);

@ApiTags('settings (admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/settings')
export class SettingsAdminController {
  constructor(private readonly service: SettingsService) {}

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Put(':key')
  set(@Param('key') key: string, @Body('value') value: unknown, @CurrentUser() u: AuthenticatedUser) {
    if (value === undefined) {
      throw new BadRequestException('Missing "value" in request body');
    }
    // Client-side hiding (isOwner checks in the admin UI) is a UX nicety, not
    // security — this is the actual enforcement. A regular ADMIN calling this
    // route directly with key=paymentSettings must be rejected here too.
    if (SUPER_ADMIN_ONLY_KEYS.has(key) && u.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only the Owner (Super Admin) can view or edit payment settings');
    }
    return this.service.set(key, value, u.id);
  }
}
