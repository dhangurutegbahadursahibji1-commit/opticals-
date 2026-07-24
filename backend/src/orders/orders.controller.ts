import {
  Body, Controller, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import { AddTimelineStepDto } from './dto/add-timeline-step.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../auth/types';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Public: customer places order (rate-limited – 5 per minute per IP)
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  @ApiOperation({ summary: 'Place a new order (public)' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  // Admin: list all orders
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @Get('admin')
  @ApiOperation({ summary: 'List all orders (admin)' })
  findAll(@Query() query: PaginationQueryDto & { status?: any; paymentStatus?: any }) {
    return this.ordersService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @Get('admin/stats')
  @ApiOperation({ summary: 'Order dashboard stats' })
  stats() {
    return this.ordersService.getDashboardStats();
  }

  // IMPORTANT: literal routes like 'admin/returns' MUST be registered before
  // the 'admin/:id' param route below. NestJS/Express match routes in
  // registration order, so if 'admin/:id' came first, a request for
  // /orders/admin/returns would be swallowed by findOne() treating "returns"
  // as an order id — which is exactly what was happening before this fix
  // (the admin Returns page always got a 404 "order not found").
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @Get('admin/returns')
  @ApiOperation({ summary: 'List return requests (admin)' })
  findAllReturns(@Query('status') status?: string) {
    return this.ordersService.findAllReturns(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @Patch('admin/returns/:id')
  @ApiOperation({ summary: 'Approve/reject/refund a return (admin)' })
  updateReturn(
    @Param('id') id: string,
    @Body() dto: UpdateReturnDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.updateReturn(id, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @Get('admin/:id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @Patch('admin/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.update(id, dto, user.id);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Get('track/:orderNumber')
  @ApiOperation({ summary: 'Track an order (public, requires phone match)' })
  trackOrder(@Param('orderNumber') orderNumber: string, @Query('phone') phone: string) {
    return this.ordersService.trackOrder(orderNumber, phone);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order (public, requires phone match)' })
  cancelOrder(@Param('id') id: string, @Body('phone') phone: string) {
    return this.ordersService.cancelOrder(id, phone);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post(':id/return')
  @ApiOperation({ summary: 'Request a return (public, requires phone match)' })
  createReturn(
    @Param('id') id: string,
    @Body('phone') phone: string,
    @Body() dto: CreateReturnDto,
  ) {
    return this.ordersService.createReturn(id, phone, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @Post('admin/:id/timeline')
  @ApiOperation({ summary: 'Add a manual timeline step (admin)' })
  addTimelineStep(
    @Param('id') id: string,
    @Body() dto: AddTimelineStepDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.addTimelineStep(id, dto, user.id);
  }
}
