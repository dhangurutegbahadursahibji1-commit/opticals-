import { Injectable, NotFoundException } from '@nestjs/common';
import { TestimonialStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(private readonly prisma: PrismaService, private readonly auditLog: AuditLogService) {}

  findAllPublic() {
    return this.prisma.testimonial.findMany({ where: { status: TestimonialStatus.APPROVED, deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  // Public submission — goes into PENDING for admin moderation ("Approval Workflow").
  async submit(dto: CreateTestimonialDto) {
    return this.prisma.testimonial.create({ data: { ...dto, status: TestimonialStatus.PENDING } });
  }

  async findAllAdmin(query: PaginationQueryDto & { status?: TestimonialStatus }) {
    const { page: _page, limit: _limit, status } = query;
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 20;
    const where = { deletedAt: null, ...(status && { status }) };
    const [items, total] = await Promise.all([
      this.prisma.testimonial.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.testimonial.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const t = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Testimonial not found');
    return t;
  }

  async moderate(id: string, status: TestimonialStatus, actorId: string) {
    await this.findOne(id);
    const t = await this.prisma.testimonial.update({ where: { id }, data: { status } });
    await this.auditLog.record({ userId: actorId, action: 'UPDATE', resource: 'testimonial', resourceId: id, metadata: { status } });
    return t;
  }

  async update(id: string, dto: UpdateTestimonialDto, actorId: string) {
    await this.findOne(id);
    const t = await this.prisma.testimonial.update({ where: { id }, data: dto });
    await this.auditLog.record({ userId: actorId, action: 'UPDATE', resource: 'testimonial', resourceId: id });
    return t;
  }

  async remove(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.testimonial.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.auditLog.record({ userId: actorId, action: 'DELETE', resource: 'testimonial', resourceId: id });
    return { success: true };
  }
}