import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class ReviewPrescriptionDto {
  @ApiProperty({ enum: ['VERIFIED', 'REJECTED'] })
  @IsString()
  @IsIn(['VERIFIED', 'REJECTED'])
  status: 'VERIFIED' | 'REJECTED';
}
