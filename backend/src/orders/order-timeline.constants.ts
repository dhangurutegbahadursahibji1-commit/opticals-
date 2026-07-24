export interface TimelineStepDef {
  step: string;
  label: string;
  autoOnPaymentStatus?: 'RECEIVED' | 'VERIFIED';
  autoOnStatus?: 'CONFIRMED' | 'PROCESSING' | 'READY' | 'DELIVERED' | 'CANCELLED';
}

export const ORDER_TIMELINE_STEPS: TimelineStepDef[] = [
  { step: 'PAYMENT_RECEIVED',  label: 'Payment Received',  autoOnPaymentStatus: 'RECEIVED' },
  { step: 'PAYMENT_VERIFIED',  label: 'Payment Verified',  autoOnPaymentStatus: 'VERIFIED' },
  { step: 'FRAME_SELECTED',    label: 'Frame Selected',    autoOnStatus: 'CONFIRMED' },
  { step: 'LENS_CUTTING',      label: 'Lens Cutting',      autoOnStatus: 'PROCESSING' },
  { step: 'LENS_FITTING',      label: 'Lens Fitting' },
  { step: 'QC',                label: 'Quality Check' },
  { step: 'PACKED',            label: 'Packed',            autoOnStatus: 'READY' },
  { step: 'DISPATCHED',        label: 'Dispatched' },
  { step: 'DELIVERED',         label: 'Delivered',         autoOnStatus: 'DELIVERED' },
];

export const MANUAL_TIMELINE_STEPS = ORDER_TIMELINE_STEPS.filter(
  (s) => !s.autoOnStatus && !s.autoOnPaymentStatus,
).map((s) => s.step);

export function canCancelOrder(status: string): boolean {
  return status === 'NEW' || status === 'CONFIRMED';
}

export function canRequestReturn(status: string): boolean {
  return status === 'DELIVERED';
}

export const RETURN_WINDOW_DAYS = 7;