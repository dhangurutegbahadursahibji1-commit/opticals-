import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TestimonialStatus } from '@prisma/client';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types';
import { Throttle } from '@nestjs/throttler';

@ApiTags('testimonials')
@Controller('testimonials')
export class TestimonialsPublicController {
  constructor(private readonly service: TestimonialsService) {}
  @Public() @Get() findAll() { return this.service.findAllPublic(); }
  @Public() @Throttle({ default: { limit: 3, ttl: 60_000 } }) @Post() submit(@Body() dto: CreateTestimonialDto) { return this.service.submit(dto); }
}

@ApiTags('testimonials (admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/testimonials')
export class TestimonialsAdminController {
  constructor(private readonly service: TestimonialsService) {}
  @Roles('VIEWER','STAFF','MANAGER','ADMIN','SUPER_ADMIN') @Get() findAll(@Query() q: PaginationQueryDto & { status?: TestimonialStatus }) { return this.service.findAllAdmin(q); }
  @Roles('VIEWER','STAFF','MANAGER','ADMIN','SUPER_ADMIN') @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Roles('MANAGER','ADMIN','SUPER_ADMIN') @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateTestimonialDto, @CurrentUser() u: AuthenticatedUser) { return this.service.update(id, dto, u.id); }
  @Roles('MANAGER','ADMIN','SUPER_ADMIN') @Patch(':id/status/:status') moderate(@Param('id') id: string, @Param('status') status: TestimonialStatus, @CurrentUser() u: AuthenticatedUser) { return this.service.moderate(id, status, u.id); }
  @Roles('ADMIN','SUPER_ADMIN') @Delete(':id') remove(@Param('id') id: string, @CurrentUser() u: AuthenticatedUser) { return this.service.remove(id, u.id); }
}
