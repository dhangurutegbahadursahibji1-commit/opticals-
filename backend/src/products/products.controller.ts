import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { BulkActionDto } from './dto/bulk-action.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types';

// -----------------------------------------------------------------
// Public, customer-facing endpoints (no auth) — powers the Vercel storefront.
// -----------------------------------------------------------------
@ApiTags('products (public)')
@Controller('products')
export class ProductsPublicController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findPublished(query);
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findPublishedBySlug(slug);
  }
}

// -----------------------------------------------------------------
// Admin endpoints — powers the admin dashboard.
// -----------------------------------------------------------------
@ApiTags('products (admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/products')
export class ProductsAdminController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles('VIEWER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Get()
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAllAdmin(query);
  }

  @Roles('VIEWER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Get('recycle-bin')
  recycleBin(@Query() query: PaginationQueryDto) {
    return this.productsService.recycleBin(query);
  }

  @Roles('VIEWER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOneAdmin(id);
  }

  @Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Post()
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.create(dto, user.id);
  }

  @Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.update(id, dto, user.id);
  }

  @Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Post(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.publish(id, user.id);
  }

  @Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Post(':id/unpublish')
  unpublish(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.unpublish(id, user.id);
  }

  @Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Post(':id/mark-sold')
  markSold(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.markSold(id, user.id);
  }

  @Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Post(':id/archive')
  archive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.archive(id, user.id);
  }

  @Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Post(':id/duplicate')
  duplicate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.duplicate(id, user.id);
  }

  @Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Post(':id/restore')
  restore(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.restore(id, user.id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @RequirePermission('products', 'delete')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.softDelete(id, user.id);
  }

  @Roles('SUPER_ADMIN')
  @Delete(':id/permanent')
  purge(@Param('id') id: string) {
    return this.productsService.purge(id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post('bulk/publish')
  bulkPublish(@Body() dto: BulkActionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.bulkPublish(dto.ids, user.id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post('bulk/archive')
  bulkArchive(@Body() dto: BulkActionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.bulkArchive(dto.ids, user.id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post('bulk/delete')
  bulkDelete(@Body() dto: BulkActionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.bulkDelete(dto.ids, user.id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post('bulk/restore')
  bulkRestore(@Body() dto: BulkActionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.bulkRestore(dto.ids, user.id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch('bulk/update')
  bulkUpdate(@Body() body: BulkActionDto & { data: UpdateProductDto }, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.bulkUpdate(body.ids, body.data, user.id);
  }
}
