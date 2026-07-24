import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BlogStatus } from '@prisma/client';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types';

@ApiTags('blogs')
@Controller('blogs')
export class BlogsPublicController {
  constructor(private readonly service: BlogsService) {}
  @Public() @Get() findAll(@Query() q: PaginationQueryDto & { category?: string }) { return this.service.findAllPublic(q); }
  @Public() @Get(':slug') findBySlug(@Param('slug') slug: string) { return this.service.findPublicBySlug(slug); }
}

@ApiTags('blogs (admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/blogs')
export class BlogsAdminController {
  constructor(private readonly service: BlogsService) {}
  @Roles('VIEWER','STAFF','MANAGER','ADMIN','SUPER_ADMIN') @Get() findAll(@Query() q: PaginationQueryDto & { status?: BlogStatus }) { return this.service.findAllAdmin(q); }
  @Roles('VIEWER','STAFF','MANAGER','ADMIN','SUPER_ADMIN') @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Roles('MANAGER','ADMIN','SUPER_ADMIN') @Post() create(@Body() dto: CreateBlogDto, @CurrentUser() u: AuthenticatedUser) { return this.service.create(dto, u.id); }
  @Roles('MANAGER','ADMIN','SUPER_ADMIN') @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateBlogDto, @CurrentUser() u: AuthenticatedUser) { return this.service.update(id, dto, u.id); }
  @Roles('ADMIN','SUPER_ADMIN') @Delete(':id') remove(@Param('id') id: string, @CurrentUser() u: AuthenticatedUser) { return this.service.remove(id, u.id); }
}
