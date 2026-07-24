import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { QueryPrescriptionDto } from './dto/query-prescription.dto';
import { ReviewPrescriptionDto } from './dto/review-prescription.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';

// Staff-only: prescriptions carry health-adjacent data (Rx values, uploaded
// photos), so unlike the storefront-facing consultation/pricing endpoints,
// nothing here is @Public().
@ApiTags('prescriptions (admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Roles('VIEWER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Get()
  findAll(@Query() query: QueryPrescriptionDto) {
    return this.prescriptionsService.findAllAdmin(query);
  }

  // Lets staff pull up a returning customer's past prescriptions by phone
  // when they call in for a new order, without a full customer-account system.
  @Roles('VIEWER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Get('by-phone/:phone')
  findByPhone(@Param('phone') phone: string) {
    return this.prescriptionsService.findByPhone(phone);
  }

  @Roles('VIEWER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prescriptionsService.findOne(id);
  }

  @Roles('STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Patch(':id/review')
  review(
    @Param('id') id: string,
    @Body() dto: ReviewPrescriptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.prescriptionsService.review(id, dto, user.id);
  }
}
