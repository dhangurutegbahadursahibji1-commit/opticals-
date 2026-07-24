import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryPrescriptionDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by the phone number on the linked consultation' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'VERIFIED', 'REJECTED'] })
  @IsOptional()
  @IsString()
  status?: string;
}
