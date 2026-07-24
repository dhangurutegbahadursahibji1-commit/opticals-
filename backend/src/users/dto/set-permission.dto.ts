import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class SetPermissionDto {
  @ApiProperty() @IsString() resource: string;
  @ApiProperty() @IsString() action: string;
  @ApiProperty() @IsBoolean() allowed: boolean;
}
