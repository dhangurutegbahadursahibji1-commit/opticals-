import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { paginate } from '../common/dto/pagination.dto';
import { QueryPrescriptionDto } from './dto/query-prescription.dto';
import { ReviewPrescriptionDto } from './dto/review-prescription.dto';

// This module was previously a completely empty stub (no routes, no methods)
// despite the Prescription model, DTOs and even spec test files already
// existing. Prescriptions were being created directly by ConsultationService,
// but there was no way for staff to list, search, or verify them at all —
// the `status`/`reviewedBy` fields on the model were written once at creation
// (always "PENDING") and never touched again by anything.
@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async findAllAdmin(query: QueryPrescriptionDto) {
    const { page: _page, limit: _limit, phone, status } = query;
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 20;

    const where = {
      ...(status && { status }),
      // Prescription itself has no phone column — phone lives on the
      // Consultation(s) that reference it, so search through that relation.
      ...(phone && { consultations: { some: { phone: { contains: phone } } } }),
    };

    const [items, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        include: { consultations: { select: { id: true, customerName: true, phone: true, createdAt: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prescription.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: { consultations: true },
    });
    if (!prescription) throw new NotFoundException('Prescription not found');
    return prescription;
  }

  /** Find prescriptions for a returning customer by phone, most recent first —
   * lets staff pull up someone's last Rx over the phone without a customer
   * account system (there isn't one in this app yet). */
  async findByPhone(phone: string) {
    return this.prisma.prescription.findMany({
      where: { consultations: { some: { phone } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async review(id: string, dto: ReviewPrescriptionDto, actorId: string) {
    await this.findOne(id);
    const prescription = await this.prisma.prescription.update({
      where: { id },
      data: { status: dto.status, reviewedBy: actorId },
    });
    await this.auditLog.record({
      userId: actorId,
      action: 'UPDATE',
      resource: 'prescription',
      resourceId: id,
      metadata: { status: dto.status },
    });
    return prescription;
  }
}
