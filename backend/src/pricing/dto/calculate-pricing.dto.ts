import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

// A real class-validator DTO. The previous version of this file used a bare
// TypeScript `interface`, which class-validator/NestJS's ValidationPipe cannot
// see at runtime (interfaces are erased at compile time) — so the endpoint was
// silently accepting anything with zero validation. This restores real checks.
export class CalculatePricingDto {
  @ApiPropertyOptional() @IsOptional() @IsString() productId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() variantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lensTypeId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true })
  addOnIds?: string[];
}
