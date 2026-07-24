import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

const DEFAULT_FEE = 50;

@Injectable()
export class ConsultationPolicyService {
  constructor(private readonly settings: SettingsService) {}

  // Reads from the admin-editable Setting table (key: 'consultationFee') so
  // staff can change the fee from Settings without a code deploy. Falls back
  // to the original default if nothing has been configured yet.
  async getPolicy() {
    const stored = await this.settings.get('consultationFee');
    const consultationFee = stored != null && !Number.isNaN(Number(stored)) ? Number(stored) : DEFAULT_FEE;

    return {
      consultationFee,
      currency: 'INR',
      isRefundable: false,
      isAdjustableAgainstFinalBill: true,
      description: `A flat ₹${consultationFee} consultation fee is required to review your prescription and process your cart. This amount is non-refundable but will be adjusted against your final bill if you proceed with the order.`,
    };
  }
}
