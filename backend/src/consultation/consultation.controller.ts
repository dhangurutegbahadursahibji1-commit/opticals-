import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConsultationService } from './consultation.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { ConsultationStatus } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Throttle } from '@nestjs/throttler';

@ApiTags('consultations')
@Controller('consultations')
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  // Public: this is what the storefront's lens configurator / checkout
  // actually submits to when a customer finishes configuring their order.
  // It previously had no @Public() decorator, so the global JwtAuthGuard
  // rejected every anonymous customer with a 401 before validation even ran
  // — meaning nobody could complete checkout through this flow at all.
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  async create(@Body() createConsultationDto: CreateConsultationDto) {
    return this.consultationService.create(createConsultationDto);
  }

  // Everything below is staff-only. Previously had no guards/roles at all
  // beyond the global JwtAuthGuard, so any authenticated account of any role
  // (even the lowest-privilege VIEWER) could read every customer's contact
  // details, prescriptions and payment info, or change a consultation's
  // status. Now matches the STAFF+ / MANAGER+ pattern used elsewhere.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VIEWER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Get()
  async findAll() {
    return this.consultationService.findAll();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VIEWER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.consultationService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ConsultationStatus,
  ) {
    return this.consultationService.updateStatus(id, status);
  }
}
