import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../auth/types';

export const REQUIRE_PERMISSION_KEY = 'requirePermission';
export interface RequiredPermission {
  resource: string;
  action: string;
}

// Fine-grained, per-user permission overrides layered on top of RolesGuard —
// lets an Admin revoke e.g. "products:delete" for one specific STAFF user without
// changing their base role. Absence of an override falls back to role-based access.
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<RequiredPermission>(REQUIRE_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    if (!user) throw new ForbiddenException('Not authenticated');
    if (user.role === 'SUPER_ADMIN') return true;

    const override = await this.prisma.userPermission.findUnique({
      where: {
        userId_resource_action: {
          userId: user.id,
          resource: required.resource,
          action: required.action,
        },
      },
    });

    if (override && !override.allowed) {
      throw new ForbiddenException(`Permission denied for ${required.resource}:${required.action}`);
    }
    return true;
  }
}
