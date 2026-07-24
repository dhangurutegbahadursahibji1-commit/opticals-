import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../../auth/types';

// Role hierarchy: higher-privilege roles automatically satisfy lower-privilege checks.
const HIERARCHY: Role[] = ['VIEWER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'];

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    if (!user) throw new ForbiddenException('Not authenticated');

    const userLevel = HIERARCHY.indexOf(user.role);
    const minRequiredLevel = Math.min(...requiredRoles.map((r) => HIERARCHY.indexOf(r)));

    if (userLevel < minRequiredLevel) {
      throw new ForbiddenException(`Requires one of roles: ${requiredRoles.join(', ')}`);
    }
    return true;
  }
}
