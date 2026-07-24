import { IsArray, IsOptional, IsString, MinLength, ArrayMaxSize } from 'class-validator';

export class CreateReturnDto {
  @IsString()
  @MinLength(10, { message: 'Please provide a bit more detail about the reason for return.' })
  reason!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6, { message: 'You can upload up to 6 photos.' })
  @IsString({ each: true })
  photoUrls?: string[];
}