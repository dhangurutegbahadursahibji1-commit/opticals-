import {
  BadRequestException, Body, Controller, Post,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { StorageService, type R2Folder } from '../storage/storage.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/types';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_MIME_VIDEO = ['video/mp4', 'video/webm'];
const ALLOWED_MIME_WITH_PDF = [...ALLOWED_MIME, 'application/pdf'];
const MAX_ADMIN_UPLOAD_SIZE = 100 * 1024 * 1024; // 100 MB
const ALLOWED_FOLDERS: R2Folder[] = ['products', 'brands', 'categories', 'blogs', 'offers', 'gallery', 'testimonials', 'settings'];

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(
    private readonly storage: StorageService,
    private readonly auditLog: AuditLogService,
  ) {}

  // ── Admin: direct upload ─────────────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Post('admin')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_ADMIN_UPLOAD_SIZE } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('No file provided.');
    if (![...ALLOWED_MIME, ...ALLOWED_MIME_VIDEO].includes(file.mimetype))
      throw new BadRequestException('Only JPG, PNG, WEBP, MP4 and WEBM are supported.');
    
    // Size validation based on type
    const isVideo = file.mimetype.startsWith('video/');
    if (!isVideo && file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Images must be under 10MB.');
    }
    
    if (!ALLOWED_FOLDERS.includes(folder as R2Folder))
      throw new BadRequestException(`folder must be one of: ${ALLOWED_FOLDERS.join(', ')}`);

    const url = await this.storage.upload(
      folder as R2Folder, file.originalname, file.buffer, file.mimetype,
    );
    await this.auditLog.record({
      userId: user.id, action: 'UPLOAD', resource: folder, metadata: { url },
    });
    return { url };
  }

  // ── Admin: presigned URL ─────────────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @Post('admin/presign')
  async presign(
    @Body('fileName') fileName: string,
    @Body('contentType') contentType: string,
    @Body('folder') folder: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (![...ALLOWED_MIME, ...ALLOWED_MIME_VIDEO].includes(contentType))
      throw new BadRequestException('Only JPG, PNG, WEBP, MP4 and WEBM are supported.');
    if (!ALLOWED_FOLDERS.includes(folder as R2Folder))
      throw new BadRequestException(`folder must be one of: ${ALLOWED_FOLDERS.join(', ')}`);

    const result = await this.storage.getPresignedUploadUrl(folder as R2Folder, fileName, contentType);
    await this.auditLog.record({
      userId: user.id, action: 'PRESIGN', resource: folder, metadata: { key: result.key },
    });
    return result;
  }

  // ── Public: customer uploads prescription or payment screenshot ──
  // Rate-limited: 10 requests per minute per IP. No auth required.
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('public')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string', enum: ['prescription', 'payment-proof'] },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } })) // 15 MB max for customer uploads (PDFs)
  async publicUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
  ) {
    if (!file) throw new BadRequestException('No file provided.');
    if (!ALLOWED_MIME_WITH_PDF.includes(file.mimetype))
      throw new BadRequestException('Only JPG, PNG, WEBP or PDF are supported.');
    if (!['prescription', 'payment-proof'].includes(type))
      throw new BadRequestException('type must be prescription or payment-proof');

    // Dedicated folders — these are private customer documents (prescription
    // photos, payment screenshots), not public marketing assets, so they no
    // longer share a bucket path with the public photo gallery.
    const folder: R2Folder = type === 'prescription' ? 'prescriptions' : 'payment-proofs';
    const url = await this.storage.upload(folder, file.originalname, file.buffer, file.mimetype);
    return { url };
  }
}
