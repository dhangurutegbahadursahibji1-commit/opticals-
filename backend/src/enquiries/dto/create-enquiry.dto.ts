import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class CreateEnquiryDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit mobile number' }) phone: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiProperty() @IsString() message: string;

  // ── Product context ────────────────────────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsString() productId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() productName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lensType?: string;

  // ── Prescription ───────────────────────────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsString() prescriptionMode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() selectedPower?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() prescriptionUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rightEyeSphere?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rightEyeCylinder?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rightEyeAxis?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() leftEyeSphere?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() leftEyeCylinder?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() leftEyeAxis?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pdValue?: string;
}