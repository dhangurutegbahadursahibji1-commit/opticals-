import { RiPhoneFill } from 'react-icons/ri';
import { getSettings } from '../../services/products';

interface CallButtonProps {
  className?: string;
  label?: string;
}

export default function CallButton({ className = '', label = 'Call Now' }: CallButtonProps) {
  const { phone } = getSettings();
  return (
    <a
      href={`tel:+91${phone.replace(/\s/g, '')}`}
      className={`inline-flex items-center gap-2 rounded-full border-2 border-primary dark:border-accent-light px-6 py-3 font-medium text-primary dark:text-accent-light transition-colors hover:bg-primary hover:text-white dark:hover:bg-accent-light dark:hover:text-primary ${className}`}
    >
      <RiPhoneFill size={18} />
      {label}
    </a>
  );
}
