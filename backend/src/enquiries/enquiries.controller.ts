import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { EnquiryStatus } from '@prisma/client';
import { EnquiriesService } from './enquiries.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { UpdateEnquiryDto } from './dto/update-enquiry.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types';

@ApiTags('contact-enquiries')
@Controller('enquiries')
export class EnquiriesPublicController {
  constructor(private readonly service: EnquiriesService) {}
  @Public() @Throttle({ default: { limit: 5, ttl: 60_000 } }) @Post() create(@Body() dto: CreateEnquiryDto) { return this.service.create(dto); }
}

@ApiTags('contact-enquiries (admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/enquiries')
export class EnquiriesAdminController {
  constructor(private readonly service: EnquiriesService) {}
  @Roles('VIEWER','STAFF','MANAGER','ADMIN','SUPER_ADMIN') @Get() findAll(@Query() q: PaginationQueryDto & { status?: EnquiryStatus }) { return this.service.findAllAdmin(q); }
  @Roles('VIEWER','STAFF','MANAGER','ADMIN','SUPER_ADMIN') @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Roles('STAFF','MANAGER','ADMIN','SUPER_ADMIN') @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateEnquiryDto, @CurrentUser() u: AuthenticatedUser) { return this.service.update(id, dto, u.id); }
  @Roles('ADMIN','SUPER_ADMIN') @Delete(':id') remove(@Param('id') id: string, @CurrentUser() u: AuthenticatedUser) { return this.service.remove(id, u.id); }
}
