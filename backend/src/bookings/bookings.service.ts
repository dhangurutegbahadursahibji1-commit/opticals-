import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService, private readonly auditLog: AuditLogService) {}

  // Public: customer submits a booking from the website (no auth).
  async create(dto: CreateBookingDto) {
    const booking = await this.prisma.eyeTestBooking.create({ data: { ...dto, date: new Date(dto.date) } });
    await this.auditLog.record({ action: 'CREATE', resource: 'eye_test_booking', resourceId: booking.id, metadata: { source: 'public' } });
    return booking;
  }

  async findAllAdmin(query: PaginationQueryDto & { status?: BookingStatus }) {
    const { page: _page, limit: _limit, status, search } = query;
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 20;
    const where = {
      ...(status && { status }),
      ...(search && { OR: [{ customerName: { contains: search, mode: 'insensitive' as const } }, { phone: { contains: search } }] }),
    };
    const [items, total] = await Promise.all([
      this.prisma.eyeTestBooking.findMany({
        where, include: { assignedStaff: { select: { firstName: true, lastName: true } } },
        skip: (page - 1) * limit, take: limit, orderBy: { date: 'asc' },
      }),
      this.prisma.eyeTestBooking.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const booking = await this.prisma.eyeTestBooking.findUnique({ where: { id }, include: { assignedStaff: true } });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async update(id: string, dto: UpdateBookingDto, actorId: string) {
    await this.findOne(id);
    const booking = await this.prisma.eyeTestBooking.update({ where: { id }, data: dto });
    await this.auditLog.record({ userId: actorId, action: 'UPDATE', resource: 'eye_test_booking', resourceId: id });
    return booking;
  }

  async remove(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.eyeTestBooking.delete({ where: { id } });
    await this.auditLog.record({ userId: actorId, action: 'DELETE', resource: 'eye_test_booking', resourceId: id });
    return { success: true };
  }

  /** CSV export for the admin dashboard's "Export" button. */
  async exportCsv(query: { status?: BookingStatus }): Promise<string> {
    const bookings = await this.prisma.eyeTestBooking.findMany({ where: query, orderBy: { date: 'asc' } });
    const header = 'Name,Phone,Date,Time,Concern,Status,Notes\n';
    const rows = bookings
      .map((b) =>
        [b.customerName, b.phone, b.date.toISOString().slice(0, 10), b.time, b.concern ?? '', b.status, (b.notes ?? '').replace(/,/g, ';')].join(',')
      )
      .join('\n');
    return header + rows;
  }
}