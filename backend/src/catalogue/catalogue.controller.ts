import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CatalogueService } from './catalogue.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

// Public: the lens configurator on the storefront needs this without login.
// This was previously missing @Public(), so the global JwtAuthGuard rejected
// every anonymous request with a 401 — which is why the configurator page
// never finished loading and appeared to "404".
@ApiTags('optical-engine')
@Controller('optical-engine')
export class CatalogueController {
  constructor(private readonly catalogueService: CatalogueService) {}

  @Public()
  @Get('catalogue')
  getPublicCatalogue() {
    return this.catalogueService.getPublicCatalogue();
  }
}

// Admin: lens types and add-ons management.
//
// Route paths here are FLAT (/admin/lenses, /admin/addons) rather than nested
// under /optical-engine/admin/... . Two reasons:
//   1. The admin dashboard's LensesTab/AddOnsTab already call `/admin/lenses`
//      and `/admin/addons` directly — they never matched the old nested path
//      at all, so this whole tab 404'd on every request regardless of guards.
//   2. It matches the /admin/<resource> convention used everywhere else
//      (brands, products, bookings, enquiries, settings...).
// Also: previously had NO guards beyond the global JwtAuthGuard, so any
// logged-in account of any role could create/edit/delete pricing-relevant
// catalogue data. Now matches the MANAGER+ pattern used for brands/categories.
@ApiTags('optical-engine (admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class CatalogueAdminController {
  constructor(private readonly catalogueService: CatalogueService) {}

  // --- LENSES ---
  @Roles('VIEWER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Get('lenses')
  getLenses() {
    return this.catalogueService.getLenses();
  }

  @Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Post('lenses')
  createLens(@Body() data: any) {
    return this.catalogueService.createLens(data);
  }

  @Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Put('lenses/:id')
  updateLens(@Param('id') id: string, @Body() data: any) {
    return this.catalogueService.updateLens(id, data);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete('lenses/:id')
  archiveLens(@Param('id') id: string) {
    return this.catalogueService.archiveLens(id);
  }

  // --- ADD-ONS ---
  @Roles('VIEWER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Get('addons')
  getAddOns() {
    return this.catalogueService.getAddOns();
  }

  @Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Post('addons')
  createAddOn(@Body() data: any) {
    return this.catalogueService.createAddOn(data);
  }

  @Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Put('addons/:id')
  updateAddOn(@Param('id') id: string, @Body() data: any) {
    return this.catalogueService.updateAddOn(id, data);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete('addons/:id')
  archiveAddOn(@Param('id') id: string) {
    return this.catalogueService.archiveAddOn(id);
  }
}
