import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GalleryService } from './gallery.service';
import { CreateGalleryItemDto } from './dto/create-gallery-item.dto';
import { UpdateGalleryItemDto } from './dto/update-gallery-item.dto';
import { CreateAlbumDto } from './dto/create-album.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types';

@ApiTags('gallery')
@Controller('gallery')
export class GalleryPublicController {
  constructor(private readonly service: GalleryService) {}
  @Public() @Get() findAll(@Query('category') category?: string) { return this.service.findAllPublic(category); }
  @Public() @Get('albums') findAlbums() { return this.service.findAlbums(); }
}

@ApiTags('gallery (admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/gallery')
export class GalleryAdminController {
  constructor(private readonly service: GalleryService) {}
  @Roles('VIEWER','STAFF','MANAGER','ADMIN','SUPER_ADMIN') @Get() findAll(@Query() q: PaginationQueryDto & { category?: string }) { return this.service.findAllAdmin(q); }
  @Roles('MANAGER','ADMIN','SUPER_ADMIN') @Post('albums') createAlbum(@Body() dto: CreateAlbumDto) { return this.service.createAlbum(dto); }
  @Roles('MANAGER','ADMIN','SUPER_ADMIN') @Post() create(@Body() dto: CreateGalleryItemDto, @CurrentUser() u: AuthenticatedUser) { return this.service.create(dto, u.id); }
  @Roles('MANAGER','ADMIN','SUPER_ADMIN') @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateGalleryItemDto, @CurrentUser() u: AuthenticatedUser) { return this.service.update(id, dto, u.id); }
  @Roles('ADMIN','SUPER_ADMIN') @Delete(':id') remove(@Param('id') id: string, @CurrentUser() u: AuthenticatedUser) { return this.service.remove(id, u.id); }
}
