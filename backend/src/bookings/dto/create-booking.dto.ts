import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty() @IsString() customerName: string;
  @ApiProperty() @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit mobile number' }) phone: string;
  @ApiProperty() @IsDateString() date: string;
  @ApiProperty() @IsString() time: string;
  @ApiPropertyOptional() @IsOptional() @IsString() concern?: string;
}
