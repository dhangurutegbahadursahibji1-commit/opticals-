import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EnquiryStatus } from '@prisma/client';

export class UpdateEnquiryDto {
  @ApiPropertyOptional({ enum: EnquiryStatus }) @IsOptional() @IsEnum(EnquiryStatus) status?: EnquiryStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() assignedStaffId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
