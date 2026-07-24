import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { AuthenticatedUser, JwtPayload } from './types';

const MAX_FAILED_ATTEMPTS = process.env.NODE_ENV === 'development' ? Infinity : 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const BCRYPT_ROUNDS = 12;

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly auditLog: AuditLogService
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toAuthenticatedUser(user: {
    id: string;
    email: string;
    role: AuthenticatedUser['role'];
    firstName: string;
    lastName: string;
  }): AuthenticatedUser {
    return { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName };
  }

  private async issueTokens(user: AuthenticatedUser, meta: RequestMeta) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.accessExpiresIn') as any,
    });

    const refreshTokenRaw = randomBytes(48).toString('hex');
    const refreshToken = this.jwt.sign(
      { ...payload, jti: refreshTokenRaw },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiresIn') as any,
      }
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshTokenRaw),
        expiresAt,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto, meta: RequestMeta) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('A user with this email already exists.');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role ?? 'STAFF',
      },
    });

    await this.auditLog.record({ userId: user.id, action: 'CREATE', resource: 'user', resourceId: user.id, ...meta });
    const authUser = this.toAuthenticatedUser(user);
    return { user: authUser, ...(await this.issueTokens(authUser, meta)) };
  }

  async login(dto: LoginDto, meta: RequestMeta) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !user.isActive) {
      await this.auditLog.record({ action: 'FAILED_LOGIN', resource: 'auth', metadata: { email: dto.email }, ...meta });
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        `Account locked until ${user.lockedUntil.toISOString()} due to repeated failed logins.`
      );
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      const failedCount = user.failedLoginCount + 1;
      const shouldLock = failedCount >= MAX_FAILED_ATTEMPTS;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: shouldLock ? 0 : failedCount,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : undefined,
        },
      });
      await this.auditLog.record({ userId: user.id, action: 'FAILED_LOGIN', resource: 'auth', ...meta });
      throw new UnauthorizedException('Invalid credentials.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: meta.ipAddress,
      },
    });

    await this.auditLog.record({ userId: user.id, action: 'LOGIN', resource: 'auth', ...meta });
    const authUser = this.toAuthenticatedUser(user);
    return { user: authUser, ...(await this.issueTokens(authUser, meta)) };
  }

  async refresh(refreshToken: string, meta: RequestMeta) {
    let payload: JwtPayload & { jti: string };
    try {
      payload = this.jwt.verify(refreshToken, { secret: this.config.get<string>('jwt.refreshSecret') });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const tokenHash = this.hashToken(payload.jti);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is no longer valid.');
    }

    // Rotate: revoke the old token, issue a new pair.
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException('User no longer active.');

    const authUser = this.toAuthenticatedUser(user);
    return { user: authUser, ...(await this.issueTokens(authUser, meta)) };
  }

  async logout(userId: string, meta: RequestMeta) {
    await this.prisma.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
    await this.auditLog.record({ userId, action: 'LOGOUT', resource: 'auth', ...meta });
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always return success to avoid leaking which emails are registered.
    if (!user) return { success: true };

    const rawToken = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(rawToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    // In production this dispatches an email via your transactional email provider.
    // Delete the logger.log line entirely and add:
if (process.env.NODE_ENV !== 'production') {
  this.logger.debug(`[DEV ONLY] Password reset token for ${email}: ${rawToken}`);
}
// TODO: Send email via Resend / SendGrid / Nodemailer
// await this.mailer.send({ to: email, subject: 'Reset your password', ... })
    return { success: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = this.hashToken(token);
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.used || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token.');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
      this.prisma.refreshToken.updateMany({ where: { userId: record.userId }, data: { revoked: true } }),
    ]);

    return { success: true };
  }

  async validateUserById(userId: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) return null;
    return this.toAuthenticatedUser(user);
  }
}