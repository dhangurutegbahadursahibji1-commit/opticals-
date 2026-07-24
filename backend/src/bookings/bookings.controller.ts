import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BookingStatus } from '@prisma/client';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types';

@ApiTags('eye-test-bookings')
@Controller('bookings')
export class BookingsPublicController {
  constructor(private readonly service: BookingsService) {}
  @Public() @Throttle({ default: { limit: 5, ttl: 60_000 } }) @Post() create(@Body() dto: CreateBookingDto) { return this.service.create(dto); }
}

@ApiTags('eye-test-bookings (admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/bookings')
export class BookingsAdminController {
  constructor(private readonly service: BookingsService) {}

  @Roles('VIEWER','STAFF','MANAGER','ADMIN','SUPER_ADMIN') @Get() findAll(@Query() q: PaginationQueryDto & { status?: BookingStatus }) { return this.service.findAllAdmin(q); }
  @Roles('VIEWER','STAFF','MANAGER','ADMIN','SUPER_ADMIN') @Get('export') @Header('Content-Type', 'text/csv') export(@Query('status') status?: BookingStatus) { return this.service.exportCsv({ status }); }
  @Roles('VIEWER','STAFF','MANAGER','ADMIN','SUPER_ADMIN') @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Roles('STAFF','MANAGER','ADMIN','SUPER_ADMIN') @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateBookingDto, @CurrentUser() u: AuthenticatedUser) { return this.service.update(id, dto, u.id); }
  @Roles('ADMIN','SUPER_ADMIN') @Delete(':id') remove(@Param('id') id: string, @CurrentUser() u: AuthenticatedUser) { return this.service.remove(id, u.id); }
}
