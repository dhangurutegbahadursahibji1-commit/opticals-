import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OfferStatus } from '@prisma/client';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types';

@ApiTags('offers')
@Controller('offers')
export class OffersPublicController {
  constructor(private readonly service: OffersService) {}
  @Public() @Get() findAll() { return this.service.findAllPublic(); }
}

@ApiTags('offers (admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/offers')
export class OffersAdminController {
  constructor(private readonly service: OffersService) {}
  @Roles('VIEWER','STAFF','MANAGER','ADMIN','SUPER_ADMIN') @Get() findAll(@Query() q: PaginationQueryDto) { return this.service.findAllAdmin(q); }
  @Roles('VIEWER','STAFF','MANAGER','ADMIN','SUPER_ADMIN') @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Roles('MANAGER','ADMIN','SUPER_ADMIN') @Post() create(@Body() dto: CreateOfferDto, @CurrentUser() u: AuthenticatedUser) { return this.service.create(dto, u.id); }
  @Roles('MANAGER','ADMIN','SUPER_ADMIN') @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateOfferDto, @CurrentUser() u: AuthenticatedUser) { return this.service.update(id, dto, u.id); }
  @Roles('MANAGER','ADMIN','SUPER_ADMIN') @Patch(':id/status/:status') setStatus(@Param('id') id: string, @Param('status') status: OfferStatus, @CurrentUser() u: AuthenticatedUser) { return this.service.setStatus(id, status, u.id); }
  @Roles('ADMIN','SUPER_ADMIN') @Delete(':id') remove(@Param('id') id: string, @CurrentUser() u: AuthenticatedUser) { return this.service.remove(id, u.id); }
}
