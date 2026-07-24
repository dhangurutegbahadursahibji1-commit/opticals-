import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateFaqDto {
  @ApiProperty() @IsString() question: string;
  @ApiProperty() @IsString() answer: string;
  @ApiPropertyOptional({ description: 'Groups items on the customer FAQ page. Defaults to "General".' })
  @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional({ description: 'Ascending display order within a category.' })
  @IsOptional() @IsInt() sortOrder?: number;
  @ApiPropertyOptional({ description: 'Unpublished FAQs are kept for drafting but hidden from the public endpoint.' })
  @IsOptional() @IsBoolean() isPublished?: boolean;
}
