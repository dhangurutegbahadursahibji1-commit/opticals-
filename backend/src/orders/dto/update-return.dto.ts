import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReturnStatus } from '@prisma/client';

export class UpdateReturnDto {
  @IsEnum(ReturnStatus)
  status!: ReturnStatus;

  @IsOptional()
  @IsString()
  adminNote?: string;
}