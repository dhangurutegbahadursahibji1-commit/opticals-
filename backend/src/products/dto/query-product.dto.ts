import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBooleanString, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryProductDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional() @IsEnum(ProductStatus) status?: ProductStatus;

  @ApiPropertyOptional() @IsOptional() @IsString() brandId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gender?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() frameShape?: string;

  @ApiPropertyOptional() @IsOptional() @IsBooleanString() isFeatured?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() isNew?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() isBestseller?: string;

  // Comma-separated list of product IDs, e.g. ?ids=a,b,c — lets the wishlist
  // and cart fetch exactly the products they reference in one call instead
  // of paging through the whole catalogue and filtering client-side (which
  // silently broke past the first page/limit).
  @ApiPropertyOptional({ type: String, description: 'Comma-separated product IDs' })
  @IsOptional()
  @IsArray() @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map((v) => v.trim()).filter(Boolean) : value))
  ids?: string[];
}
