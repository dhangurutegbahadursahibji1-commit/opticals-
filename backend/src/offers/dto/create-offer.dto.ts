import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOfferDto {
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: ['percentage', 'flat'] }) @IsOptional() @IsIn(['percentage', 'flat']) discountType?: string;
  @ApiProperty() @IsNumber() discountValue: number;
  @ApiPropertyOptional() @IsOptional() @IsString() couponCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bannerUrl?: string;
  @ApiProperty() @IsDateString() validFrom: string;
  @ApiProperty() @IsDateString() validUntil: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() usageLimit?: number;
}
