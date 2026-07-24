import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateTestimonialDto {
  @ApiProperty() @IsString() customerName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerImage?: string;
  @ApiProperty() @IsInt() @Min(1) @Max(5) rating: number;
  @ApiProperty() @IsString() review: string;
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
}
