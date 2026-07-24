import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateAlbumDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() category: string;
}
