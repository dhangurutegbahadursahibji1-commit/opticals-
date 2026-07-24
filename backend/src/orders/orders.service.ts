import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import {
  ORDER_TIMELINE_STEPS,
  canCancelOrder,
  canRequestReturn,
  RETURN_WINDOW_DAYS,
} from './order-timeline.constants';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import { AddTimelineStepDto } from './dto/add-timeline-step.dto';

function generateOrderNumber(): string {
  const prefix = 'AO';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  // ── Public: customer places an order ────────────────────────────
  async create(dto: CreateOrderDto) {
    const order = await this.prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName: dto.customerName,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        fulfilment: dto.fulfilment ?? 'store-pickup',
        productId: dto.productId,
        productName: dto.productName,
        variantColor: dto.variantColor,
        quantity: dto.quantity ?? 1,
        framePrice: dto.framePrice,
        lensType: dto.lensType,
        lensPrice: dto.lensPrice ?? 0,
        totalAmount: dto.totalAmount,
        prescriptionMode: dto.prescriptionMode ?? 'manual',
        selectedPower: dto.selectedPower,
        prescriptionUrl: dto.prescriptionUrl,
        rightEyeSphere: dto.rightEyeSphere,
        rightEyeCylinder: dto.rightEyeCylinder,
        rightEyeAxis: dto.rightEyeAxis,
        leftEyeSphere: dto.leftEyeSphere,
        leftEyeCylinder: dto.leftEyeCylinder,
        leftEyeAxis: dto.leftEyeAxis,
        pdValue: dto.pdValue,
        paymentMethod: dto.paymentMethod ?? 'upi',
        utrNumber: dto.utrNumber,
        paymentProofUrl: dto.paymentProofUrl,
        notes: dto.notes,
        expertAssistance: dto.expertAssistance ?? false,
        customerNotes: dto.customerNotes,
        amountPaid: dto.amountPaid ?? 0,
        amountDue: dto.amountDue ?? dto.totalAmount,
      },
    });

    await this.auditLog.record({
      action: 'CREATE',
      resource: 'order',
      resourceId: order.id,
      metadata: { orderNumber: order.orderNumber, source: 'public' },
    });

    return order;
  }

  // ── Admin: list all orders with filters ─────────────────────────
  async findAll(
    query: PaginationQueryDto & { status?: OrderStatus; paymentStatus?: PaymentStatus },
  ) {
    const { page: _page, limit: _limit, search, status, paymentStatus } = query;
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 20;

    const where = {
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(search && {
        OR: [
          { customerName: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
          { orderNumber: { contains: search, mode: 'insensitive' as const } },
          { productName: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async update(id: string, dto: UpdateOrderDto, actorId: string) {
    await this.findOne(id);
    const order = await this.prisma.order.update({ where: { id }, data: dto });

    if (dto.paymentStatus) {
      const def = ORDER_TIMELINE_STEPS.find((s) => s.autoOnPaymentStatus === dto.paymentStatus);
      if (def) await this.upsertTimelineStep(id, def.step, def.label);
    }
    if (dto.status) {
      const def = ORDER_TIMELINE_STEPS.find((s) => s.autoOnStatus === dto.status);
      if (def) await this.upsertTimelineStep(id, def.step, def.label);
    }

    await this.auditLog.record({
      userId: actorId,
      action: 'UPDATE',
      resource: 'order',
      resourceId: id,
      metadata: dto as Record<string, unknown>,
    });
    return order;
  }

  async getDashboardStats() {
    const [total, newOrders, pendingPayment, todayRevenue] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'NEW' } }),
      this.prisma.order.count({ where: { paymentStatus: 'PENDING' } }),
      this.prisma.order.aggregate({
        where: {
          paymentStatus: 'VERIFIED',
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        _sum: { totalAmount: true },
      }),
    ]);
    return {
      total,
      newOrders,
      pendingPayment,
      todayRevenue: Number(todayRevenue._sum.totalAmount ?? 0),
    };
  }
  async trackOrder(orderNumber: string, phone: string) {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber, phone },
      include: {
        timeline: { orderBy: { completedAt: 'asc' } },
        returnRequest: true,
      },
    });
    if (!order) throw new NotFoundException('No order found with that order number and phone.');
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      productName: order.productName,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      canCancel: canCancelOrder(order.status),
      canReturn: canRequestReturn(order.status) && !order.returnRequest,
      steps: ORDER_TIMELINE_STEPS.map((def) => {
        const completed = order.timeline.find((t) => t.step === def.step);
        return {
          step: def.step,
          label: def.label,
          completed: Boolean(completed),
          completedAt: completed?.completedAt ?? null,
          note: completed?.note ?? null,
        };
      }),
      returnRequest: order.returnRequest,
    };
  }

  private async upsertTimelineStep(orderId: string, step: string, label: string, note?: string) {
    const existing = await this.prisma.orderTimeline.findFirst({ where: { orderId, step } });
    if (existing) return existing;
    return this.prisma.orderTimeline.create({
      data: { orderId, step, label, note },
    });
  }

  async addTimelineStep(orderId: string, dto: AddTimelineStepDto, actorId: string) {
    const order = await this.findOne(orderId);
    const def = ORDER_TIMELINE_STEPS.find((s) => s.step === dto.step);
    if (!def) throw new BadRequestException('Unknown timeline step.');
    const entry = await this.upsertTimelineStep(order.id, def.step, def.label, dto.note);
    await this.auditLog.record({
      userId: actorId,
      action: 'UPDATE',
      resource: 'order_timeline',
      resourceId: order.id,
      metadata: { step: dto.step, note: dto.note },
    });
    return entry;
  }

  async cancelOrder(id: string, phone: string) {
    const order = await this.prisma.order.findFirst({ where: { id, phone } });
    if (!order) throw new NotFoundException('Order not found.');
    if (!canCancelOrder(order.status)) {
      throw new ForbiddenException(
        order.status === 'DELIVERED'
          ? 'This order has already been delivered. Please request a return instead.'
          : 'This order can no longer be cancelled — it is already being processed.',
      );
    }
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    await this.upsertTimelineStep(id, 'CANCELLED', 'Order Cancelled', 'Cancelled by customer');
    await this.auditLog.record({
      action: 'UPDATE',
      resource: 'order',
      resourceId: id,
      metadata: { status: 'CANCELLED', source: 'customer' },
    });
    return updated;
  }

  async createReturn(orderId: string, phone: string, dto: CreateReturnDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, phone },
      include: { returnRequest: true, timeline: true },
    });
    if (!order) throw new NotFoundException('Order not found.');
    if (!canRequestReturn(order.status)) {
      throw new ForbiddenException('Returns can only be requested for delivered orders.');
    }
    if (order.returnRequest) {
      throw new BadRequestException('A return has already been requested for this order.');
    }
    const deliveredStep = order.timeline.find((t) => t.step === 'DELIVERED');
    const deliveredAt = deliveredStep?.completedAt ?? order.updatedAt;
    const daysSinceDelivery = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
      throw new ForbiddenException(`The ${RETURN_WINDOW_DAYS}-day return window for this order has passed.`);
    }
    const returnRequest = await this.prisma.orderReturn.create({
      data: {
        orderId,
        reason: dto.reason,
        photoUrls: dto.photoUrls ?? [],
      },
    });
    await this.auditLog.record({
      action: 'CREATE',
      resource: 'order_return',
      resourceId: returnRequest.id,
      metadata: { orderId, reason: dto.reason },
    });
    return returnRequest;
  }

  async findAllReturns(status?: string) {
    return this.prisma.orderReturn.findMany({
      where: status ? { status: status as any } : undefined,
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReturn(returnId: string, dto: UpdateReturnDto, actorId: string) {
    const existing = await this.prisma.orderReturn.findUnique({ where: { id: returnId } });
    if (!existing) throw new NotFoundException('Return request not found.');
    const updated = await this.prisma.orderReturn.update({
      where: { id: returnId },
      data: { status: dto.status, adminNote: dto.adminNote },
    });
    if (dto.status === 'REFUNDED') {
      await this.prisma.order.update({
        where: { id: existing.orderId },
        data: { status: 'CANCELLED', paymentStatus: 'REFUNDED' },
      });
    }
    await this.auditLog.record({
      userId: actorId,
      action: 'UPDATE',
      resource: 'order_return',
      resourceId: returnId,
      metadata: { status: dto.status },
    });
    return updated;
  }
}