import { Module } from '@nestjs/common';
import { ConsultationPolicyController } from './consultation-policy.controller';
import { ConsultationPolicyService } from './consultation-policy.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [ConsultationPolicyController],
  providers: [ConsultationPolicyService],
  exports: [ConsultationPolicyService],
})
export class ConsultationPolicyModule {}
