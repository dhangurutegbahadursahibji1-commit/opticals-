import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsNumber } from 'class-validator';

export class CreateConsultationDto {
  @IsString()
  customerName: string;

  @IsString()
  phone: string;

  @IsString()
  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  fulfilment?: string;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  productName?: string;

  @IsString()
  @IsOptional()
  variantColor?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  framePrice?: number;

  @IsString()
  @IsOptional()
  lensType?: string;

  @IsNumber()
  @IsOptional()
  lensPrice?: number;

  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @IsString()
  @IsOptional()
  selectedPower?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  utrNumber?: string;

  @IsString()
  @IsOptional()
  paymentProofUrl?: string;

  @IsBoolean()
  @IsOptional()
  expertAssistance?: boolean;

  @IsString()
  @IsOptional()
  customerNotes?: string;

  @IsString()
  @IsOptional()
  prescriptionUrl?: string;

  @IsString()
  @IsOptional()
  prescriptionMode?: string;

  @IsNumber()
  @IsOptional()
  rightEyeSphere?: number;

  @IsNumber()
  @IsOptional()
  rightEyeCylinder?: number;

  @IsNumber()
  @IsOptional()
  rightEyeAxis?: number;

  @IsNumber()
  @IsOptional()
  leftEyeSphere?: number;

  @IsNumber()
  @IsOptional()
  leftEyeCylinder?: number;

  @IsNumber()
  @IsOptional()
  leftEyeAxis?: number;

  @IsNumber()
  @IsOptional()
  pdValue?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsObject()
  @IsOptional()
  commercialSnapshot?: any;
}
