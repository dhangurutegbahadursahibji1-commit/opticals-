import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types';

@ApiTags('brands')
@Controller('brands')
export class BrandsPublicController {
  constructor(private readonly service: BrandsService) {}
  @Public() @Get() findAll() { return this.service.findAllPublic(); }
}

@ApiTags('brands (admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/brands')
export class BrandsAdminController {
  constructor(private readonly service: BrandsService) {}

  @Roles('VIEWER','STAFF','MANAGER','ADMIN','SUPER_ADMIN') @Get() findAll(@Query() q: PaginationQueryDto) { return this.service.findAllAdmin(q); }
  @Roles('VIEWER','STAFF','MANAGER','ADMIN','SUPER_ADMIN') @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Roles('MANAGER','ADMIN','SUPER_ADMIN') @Post() create(@Body() dto: CreateBrandDto, @CurrentUser() u: AuthenticatedUser) { return this.service.create(dto, u.id); }
  @Roles('MANAGER','ADMIN','SUPER_ADMIN') @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateBrandDto, @CurrentUser() u: AuthenticatedUser) { return this.service.update(id, dto, u.id); }
  @Roles('ADMIN','SUPER_ADMIN') @Delete(':id') remove(@Param('id') id: string, @CurrentUser() u: AuthenticatedUser) { return this.service.remove(id, u.id); }
}
