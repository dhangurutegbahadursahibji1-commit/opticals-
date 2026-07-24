import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateGalleryItemDto {
  @ApiProperty() @IsString() url: string;
  @ApiPropertyOptional({ enum: ['image', 'video'] }) @IsOptional() @IsIn(['image', 'video']) type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() altText?: string;
  @ApiProperty() @IsString() category: string;
  @ApiPropertyOptional() @IsOptional() @IsString() albumId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() displayOrder?: number;
}
