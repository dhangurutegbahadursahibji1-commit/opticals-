import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SetPermissionDto } from './dto/set-permission.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService
  ) {}

  async findAll(query: PaginationQueryDto) {
    const { page: _page, limit: _limit, search } = query;
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 20;
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, email: true, firstName: true, lastName: true, role: true,
          isActive: true, lastLoginAt: true, createdAt: true, phone: true, avatarUrl: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true, isActive: true,
        lastLoginAt: true, createdAt: true, phone: true, avatarUrl: true, permissions: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    await this.findOne(id);
    const user = await this.prisma.user.update({ where: { id }, data: dto });
    await this.auditLog.record({ userId: actorId, action: 'UPDATE', resource: 'user', resourceId: id });
    return user;
  }

  async remove(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    await this.auditLog.record({ userId: actorId, action: 'DELETE', resource: 'user', resourceId: id });
    return { success: true };
  }

  async setPermission(userId: string, dto: SetPermissionDto, actorId: string) {
    await this.findOne(userId);
    const permission = await this.prisma.userPermission.upsert({
      where: { userId_resource_action: { userId, resource: dto.resource, action: dto.action } },
      create: { userId, resource: dto.resource, action: dto.action, allowed: dto.allowed },
      update: { allowed: dto.allowed },
    });
    await this.auditLog.record({
      userId: actorId,
      action: 'UPDATE',
      resource: 'user_permission',
      resourceId: userId,
      metadata: { resource: dto.resource, action: dto.action, allowed: dto.allowed },
    });
    return permission;
  }
}