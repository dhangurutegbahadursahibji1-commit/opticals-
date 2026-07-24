import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitContactEnquiry } from '../../services/api';

const schema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  message: z.string().min(5, 'Tell us a bit more'),
});
type Values = z.infer<typeof schema>;

export default function ContactForm() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<Values>({ resolver: zodResolver(schema) });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const onSubmit = async (values: Values) => {
    setStatus('sending');
    try {
      await submitContactEnquiry({ name: values.name, phone: values.phone, email: values.email || undefined, message: values.message });
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
        <label className="block text-xs font-mono uppercase text-muted mb-1" htmlFor="c-name">Full Name</label>
        <input id="c-name" {...register('name')} className={inputClass} />
        {errors.name && <p className="text-xs text-error mt-1">{errors.name.message}</p>}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono uppercase text-muted mb-1" htmlFor="c-phone">Phone Number</label>
          <input id="c-phone" {...register('phone')} placeholder="98XXXXXXXX" className={inputClass} />
          {errors.phone && <p className="text-xs text-error mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-mono uppercase text-muted mb-1" htmlFor="c-email">Email (optional)</label>
          <input id="c-email" type="email" {...register('email')} className={inputClass} />
          {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-xs font-mono uppercase text-muted mb-1" htmlFor="c-message">Message</label>
        <textarea id="c-message" {...register('message')} rows={4} className={inputClass} />
        {errors.message && <p className="text-xs text-error mt-1">{errors.message.message}</p>}
      </div>
      <button type="submit" disabled={status === 'sending'} className="w-full rounded-full bg-primary px-6 py-3.5 font-medium text-white disabled:opacity-60">
        {status === 'sending' ? 'Sending…' : 'Send Message'}
      </button>
      {status === 'sent' && <p className="text-center text-xs text-success">Thanks — we'll get back to you shortly.</p>}
      {status === 'error' && <p className="text-center text-xs text-error">Could not send — please call us instead.</p>}
    </form>
  );
}