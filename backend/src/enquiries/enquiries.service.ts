import { Injectable, NotFoundException } from '@nestjs/common';
import { EnquiryStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { UpdateEnquiryDto } from './dto/update-enquiry.dto';

@Injectable()
export class EnquiriesService {
  constructor(private readonly prisma: PrismaService, private readonly auditLog: AuditLogService) {}

  async create(dto: CreateEnquiryDto) {
    const enquiry = await this.prisma.contactEnquiry.create({ data: dto });
    await this.auditLog.record({ action: 'CREATE', resource: 'contact_enquiry', resourceId: enquiry.id, metadata: { source: 'public' } });
    return enquiry;
  }

  async findAllAdmin(query: PaginationQueryDto & { status?: EnquiryStatus }) {
    const { page: _page, limit: _limit, status, search } = query;
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 20;
    const where = {
      ...(status && { status }),
      ...(search && { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { phone: { contains: search } }] }),
    };
    const [items, total] = await Promise.all([
      this.prisma.contactEnquiry.findMany({
        where, include: { assignedStaff: { select: { firstName: true, lastName: true } } },
        skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contactEnquiry.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const enquiry = await this.prisma.contactEnquiry.findUnique({ where: { id }, include: { assignedStaff: true } });
    if (!enquiry) throw new NotFoundException('Enquiry not found');
    return enquiry;
  }

  async update(id: string, dto: UpdateEnquiryDto, actorId: string) {
    await this.findOne(id);
    const enquiry = await this.prisma.contactEnquiry.update({ where: { id }, data: dto });
    await this.auditLog.record({ userId: actorId, action: 'UPDATE', resource: 'contact_enquiry', resourceId: id });
    return enquiry;
  }

  async remove(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.contactEnquiry.delete({ where: { id } });
    await this.auditLog.record({ userId: actorId, action: 'DELETE', resource: 'contact_enquiry', resourceId: id });
    return { success: true };
  }
}