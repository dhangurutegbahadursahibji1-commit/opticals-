import { IsIn, IsOptional, IsString } from 'class-validator';
import { MANUAL_TIMELINE_STEPS } from '../order-timeline.constants';

export class AddTimelineStepDto {
  @IsIn(MANUAL_TIMELINE_STEPS, {
    message: `step must be one of: ${MANUAL_TIMELINE_STEPS.join(', ')}`,
  })
  step!: string;

  @IsOptional()
  @IsString()
  note?: string;
}