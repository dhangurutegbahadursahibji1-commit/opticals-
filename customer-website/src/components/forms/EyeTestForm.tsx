import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitEyeTestBooking } from '../../services/api';

const schema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  date: z.string().min(1, 'Choose a date'),
  time: z.string().min(1, 'Choose a time'),
});
type Values = z.infer<typeof schema>;

export default function EyeTestForm() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<Values>({ resolver: zodResolver(schema) });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const onSubmit = async (values: Values) => {
    setStatus('sending');
    try {
      await submitEyeTestBooking({ customerName: values.name, phone: values.phone, date: values.date, time: values.time });
      setStatus('sent');
      reset();
    } catch {
      setStatus('error');
    }
  };

  const inputClass = 'w-full rounded-xl border border-primary/15 dark:border-white/15 bg-white dark:bg-dark-card px-3 py-2.5 text-sm outline-none focus:border-accent';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs font-mono uppercase text-muted mb-1" htmlFor="et-name">Full Name</label>
        <input id="et-name" {...register('name')} className={inputClass} />
        {errors.name && <p className="text-xs text-error mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-mono uppercase text-muted mb-1" htmlFor="et-phone">Phone Number</label>
        <input id="et-phone" {...register('phone')} placeholder="98XXXXXXXX" className={inputClass} />
        {errors.phone && <p className="text-xs text-error mt-1">{errors.phone.message}</p>}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono uppercase text-muted mb-1" htmlFor="et-date">Preferred Date</label>
          <input id="et-date" type="date" {...register('date')} className={inputClass} />
          {errors.date && <p className="text-xs text-error mt-1">{errors.date.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-mono uppercase text-muted mb-1" htmlFor="et-time">Preferred Time</label>
          <input id="et-time" type="time" {...register('time')} className={inputClass} />
          {errors.time && <p className="text-xs text-error mt-1">{errors.time.message}</p>}
        </div>
      </div>
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full rounded-full bg-success px-6 py-3.5 font-medium text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
      >
        {status === 'sending' ? 'Booking…' : 'Book Free Eye Test'}
      </button>
      {status === 'sent' && <p className="text-center text-xs text-success">Booked — we'll see you then!</p>}
      {status === 'error' && <p className="text-center text-xs text-error">Could not book — please call us instead.</p>}
    </form>
  );
}