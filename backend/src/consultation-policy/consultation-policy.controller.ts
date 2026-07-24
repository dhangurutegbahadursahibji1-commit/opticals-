import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ConsultationPolicyService } from './consultation-policy.service';

@ApiTags('consultation-policy')
@Controller('consultation-policy')
export class ConsultationPolicyController {
  constructor(private readonly policyService: ConsultationPolicyService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get current consultation fee and policy rules' })
  getPolicy() {
    return this.policyService.getPolicy();
  }
}
