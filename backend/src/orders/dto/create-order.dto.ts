import { IsString, IsOptional, IsNumber, IsEnum, Min, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @ApiProperty() @IsString() customerName: string;
  @ApiProperty() @IsString() phone: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiProperty() @IsString() address: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fulfilment?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() productId?: string;
  @ApiProperty() @IsString() productName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() variantColor?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) @Min(1) quantity?: number;
  @ApiProperty() @IsNumber() @Type(() => Number) framePrice: number;

  @ApiPropertyOptional() @IsOptional() @IsString() lensType?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) lensPrice?: number;
  @ApiProperty() @IsNumber() @Type(() => Number) totalAmount: number;

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

  @ApiPropertyOptional() @IsOptional() @IsString() paymentMethod?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() utrNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentProofUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() expertAssistance?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() customerNotes?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) amountPaid?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) amountDue?: number;
}