import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested,
} from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class ProductImageInputDto {
  @ApiProperty() @IsString() url: string;
  @ApiPropertyOptional() @IsOptional() @IsString() webpUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() avifUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() thumbUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() angle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() altText?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPrimary?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() variantId?: string;
}

export class ProductVariantInputDto {
  @ApiProperty() @IsString() color: string;
  @ApiPropertyOptional() @IsOptional() @IsString() colorHex?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) stock?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() availability?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() videoUrl?: string;
  @ApiPropertyOptional({ type: [ProductImageInputDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ProductImageInputDto)
  images?: ProductImageInputDto[];
}

export class CreateProductDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsNumber() price: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() originalPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) stock?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) lowStockThreshold?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() gender?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() material?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() frameShape?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() frameWidth?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() lensWidth?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() bridgeWidth?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() templeLength?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() weight?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() warranty?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() seoTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() seoDescription?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() brandId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;

  @ApiPropertyOptional({ enum: ProductStatus }) @IsOptional() @IsEnum(ProductStatus) status?: ProductStatus;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() isNew?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isBestseller?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) suitableFaceShapes?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) recommendedLens?: string[];

  @ApiPropertyOptional({ type: [ProductVariantInputDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ProductVariantInputDto)
  variants?: ProductVariantInputDto[];
}
